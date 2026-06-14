export type MonitorStatus = 'up' | 'down' | 'unknown';

export interface Monitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  interval: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  /** Derived from the latest ping; `unknown` until first checked. */
  status: MonitorStatus;
  responseTime: number | null;
  lastCheckedAt: string | null;
  aiRisk: Risk | null;
  aiReason: string | null;
  aiCheckedAt: string | null;
}

export type Risk = 'low' | 'medium' | 'high';

export interface AnomalyResult {
  risk: Risk;
  reason: string;
  checkedAt: string;
}

export type RangeKey = '24h' | '7d' | '30d';

export interface MonitorStats {
  status: MonitorStatus;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastResponseTime: number | null;
  avgResponseTime: number | null;
  uptime: Record<RangeKey, number | null>;
}

export interface PingPoint {
  checkedAt: string;
  responseTime: number | null;
  status: MonitorStatus;
}

export interface Incident {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface PublicCheck {
  status: MonitorStatus;
  checkedAt: string;
}

export interface PublicMonitor {
  id: string;
  name: string;
  status: MonitorStatus;
  uptime7d: number | null;
  recentChecks: PublicCheck[];
}

export interface PublicStatus {
  user: { username: string; name: string };
  monitors: PublicMonitor[];
}
