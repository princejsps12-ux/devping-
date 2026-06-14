import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { signToken } from '../utils/jwt';
import { loginSchema, signupSchema } from '../utils/validation';
import { generateUniqueUsername } from '../utils/username';

const SALT_ROUNDS = 10;

export async function signup(req: Request, res: Response): Promise<void> {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  // Derive a public handle from the email local part (e.g. ada@x.com → "ada").
  const username = await generateUniqueUsername(email.split('@')[0] || name);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, username },
    select: { id: true, name: true, email: true, username: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
    token,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  // req.user is populated by requireAuth middleware.
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(200).json({ user });
}
