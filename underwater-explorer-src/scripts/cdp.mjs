/**
 * 最小 Chrome DevTools Protocol 客户端（无第三方依赖）
 * 用途：无头运行时验证 —— Runtime.evaluate / 读 console。
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export interface Cdp {
  evaluate<T = unknown>(expression: string): Promise<T>;
  close(): void;
}

export async function openChrome(url: string, opts: { virtualTimeBudget?: number } = {}): Promise<Cdp> {
  const port = 9333;
  const args = [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--remote-debugging-address=127.0.0.1',
    '--use-angle=swiftshader-webgl',
    '--use-gl=angle',
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ];
  if (opts.virtualTimeBudget) args.push('--virtual-time-budget=' + opts.virtualTimeBudget);
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let wsUrl = '';
  const ws = await new Promise<globalThis.WebSocket>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('chrome ws timeout')), 15000);
    const tryFetch = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        const j = (await res.json()) as { webSocketDebuggerUrl?: string };
        if (j.webSocketDebuggerUrl) {
          clearTimeout(timeout);
          const u = new URL(j.webSocketDebuggerUrl);
          resolve(new globalThis.WebSocket(`ws://127.0.0.1:${port}/devtools/page/${u.pathname.split('/').pop()}`));
        } else setTimeout(tryFetch, 200);
      } catch {
        setTimeout(tryFetch, 200);
      }
    };
    proc.stderr?.on('data', () => void 0);
    tryFetch();
  });
  wsUrl;

  let msgId = 0;
  const pending = new Map<number, (v: unknown) => void>();
  const events: { method: string; params: Record<string, unknown> }[] = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(String((ev as MessageEvent<string>).data));
    if (m.id !== undefined && pending.has(m.id)) {
      pending.get(m.id)!(m);
      pending.delete(m.id);
    } else if (m.method) events.push(m);
  });

  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<Record<string, never>>((resolve) => {
      const id = ++msgId;
      pending.set(id, resolve as (v: unknown) => void);
      ws.send(JSON.stringify({ id, method, params }));
    });

  // 连到页面 target（先拿 target 列表）
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  void targets;

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url });

  // 等加载
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const st = await evaluateRaw('document.readyState');
    if (st === 'complete') break;
  }

  async function evaluateRaw(expr: string): Promise<unknown> {
    const r = (await send('Runtime.evaluate', { expression: expr, returnByValue: true })) as {
      result?: { result?: { value?: unknown } };
    };
    return r?.result?.result?.value;
  }

  return {
    evaluate: evaluateRaw as Cdp['evaluate'],
    close() {
      try { ws.close(); } catch { /* ignore */ }
      proc.kill('SIGKILL');
    },
  };
}
