import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

export async function startApi(databaseUrl: string) {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port.');
  const port = address.port;
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));

  const child = spawn(process.execPath, [resolve('dist/bundle.cjs')], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl,
      JWT_SECRET: 'e2e-only-secret-isolated-from-application-credentials', PORT: String(port) },
  });
  let logs = '';
  let spawnError: Error | undefined;
  child.stdout.on('data', data => { logs = (logs + data.toString()).slice(-4000); });
  child.stderr.on('data', data => { logs = (logs + data.toString()).slice(-4000); });
  child.on('error', error => { spawnError = error; });
  const baseUrl = `http://127.0.0.1:${port}`;
  const close = async () => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  };

  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`API exited before startup: ${logs}`);
      try {
        const response = await fetch(`${baseUrl}/store/status`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) return { baseUrl, close };
      } catch { /* Wait for the production bundle to start listening. */ }
      await setTimeout(100);
    }
    throw new Error(`API did not become ready: ${logs}`);
  } catch (error) {
    await close();
    throw error;
  }
}
