import Groq from 'groq-sdk';
import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../config/db';
import { env } from '../config/env';

export type Risk = 'low' | 'medium' | 'high';

export interface AnomalyResult {
  risk: Risk;
  reason: string;
}

/** Thrown when an analysis is requested but no Groq key is configured. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI analysis is not configured. Set GROQ_API_KEY to enable it.');
    this.name = 'AiNotConfiguredError';
  }
}

const groq = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;
const PING_WINDOW = 20;

interface PingSample {
  status: string;
  responseTime: number | null;
  checkedAt: Date;
}

/**
 * Defensively parse the model's response into a valid AnomalyResult. Handles
 * raw JSON, JSON wrapped in prose/markdown, and missing/invalid fields.
 */
export function parseRiskResponse(raw: string): AnomalyResult {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    // Fall back to extracting the first {...} block.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        obj = JSON.parse(match[0]);
      } catch {
        obj = undefined;
      }
    }
  }

  const record = (obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;
  const rawRisk = typeof record.risk === 'string' ? record.risk.toLowerCase().trim() : '';
  const risk: Risk = rawRisk === 'high' ? 'high' : rawRisk === 'medium' ? 'medium' : 'low';
  const reason =
    typeof record.reason === 'string' && record.reason.trim()
      ? record.reason.trim().slice(0, 280)
      : 'No specific anomalies detected.';

  return { risk, reason };
}

function buildPrompt(name: string, url: string, pings: PingSample[]): string {
  const rows = pings
    .map(
      (p, i) =>
        `${i + 1}. ${p.checkedAt.toISOString()} | ${p.status} | ${
          p.responseTime !== null ? `${p.responseTime}ms` : 'no response'
        }`
    )
    .join('\n');

  return `Monitor: ${name} (${url})
Here are the last ${pings.length} health checks (oldest first): timestamp | status | response time.
${rows}

Analyze whether response times are trending upward abnormally, becoming erratic, or otherwise showing signs of instability that could indicate imminent downtime.
Respond with ONLY a JSON object (no markdown, no extra prose) of exactly this shape:
{"risk": "low" | "medium" | "high", "reason": "<one concise sentence, max 200 chars>"}
Guidance: "low" = stable and healthy; "medium" = some degradation or rising variance worth watching; "high" = strong signs of impending failure or active instability.`;
}

/**
 * Analyze a monitor's recent pings for downtime risk, persist the result on the
 * monitor, and return it. Throws AiNotConfiguredError if Groq isn't set up.
 */
export async function analyzeMonitor(monitorId: string): Promise<AnomalyResult & { checkedAt: Date }> {
  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    throw new Error('Monitor not found');
  }

  const pings = await prisma.ping.findMany({
    where: { monitorId },
    orderBy: { checkedAt: 'desc' },
    take: PING_WINDOW,
    select: { status: true, responseTime: true, checkedAt: true },
  });

  let result: AnomalyResult;

  if (pings.length === 0) {
    result = { risk: 'low', reason: 'No checks recorded yet — not enough data to assess risk.' };
  } else if (!groq) {
    throw new AiNotConfiguredError();
  } else {
    const ordered = pings.slice().reverse(); // oldest → newest for the prompt
    const completion = await groq.chat.completions.create({
      model: env.groqModel,
      temperature: 0.2,
      // Ask Groq to constrain output to a JSON object.
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a site-reliability assistant. You analyze uptime monitoring data and reply with strict JSON only.',
        },
        { role: 'user', content: buildPrompt(monitor.name, monitor.url, ordered) },
      ],
    });

    result = parseRiskResponse(completion.choices[0]?.message?.content ?? '');
  }

  const checkedAt = new Date();
  await prisma.monitor.update({
    where: { id: monitorId },
    data: { aiRisk: result.risk, aiReason: result.reason, aiCheckedAt: checkedAt },
  });

  return { ...result, checkedAt };
}

let task: ScheduledTask | null = null;

/**
 * Optionally re-analyze every active monitor every 10 minutes. No-ops (with a
 * one-time log) when Groq isn't configured.
 */
export function startAnomalyCron(): ScheduledTask | null {
  if (!groq) {
    console.log('[anomaly] GROQ_API_KEY not set — skipping scheduled AI analysis');
    return null;
  }

  task = cron.schedule('*/10 * * * *', async () => {
    try {
      const monitors = await prisma.monitor.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
      for (const monitor of monitors) {
        try {
          const { risk } = await analyzeMonitor(monitor.id);
          console.log(`[anomaly] ${monitor.name}: risk=${risk}`);
        } catch (error) {
          console.error(`[anomaly] failed to analyze ${monitor.name}:`, error);
        }
      }
    } catch (error) {
      console.error('[anomaly] scheduled run failed:', error);
    }
  });

  console.log('[anomaly] started — analyzing active monitors every 10 minutes');
  return task;
}
