import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const ROOT = join(import.meta.dirname, '..');
export const CACHE_DIR = join(ROOT, '.cache');

/** Minimal .env loader — only the tools need it, no dotenv dependency. */
export function loadEnv(): void {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!;
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Put it in .env (see .env.example).`);
    process.exit(1);
  }
  return v;
}

export const sha = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 16);

export function cachePath(key: string, ext: string): string {
  mkdirSync(CACHE_DIR, { recursive: true });
  return join(CACHE_DIR, `${key}.${ext}`);
}

export function writeOut(path: string, data: Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`wrote ${path}`);
}

export async function pollUntil<T>(
  fn: () => Promise<T | null>,
  intervalMs = 5000,
  timeoutMs = 15 * 60 * 1000,
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const r = await fn();
    if (r !== null) return r;
    if (Date.now() - start > timeoutMs) throw new Error('poll timeout');
    await new Promise((r2) => setTimeout(r2, intervalMs));
  }
}
