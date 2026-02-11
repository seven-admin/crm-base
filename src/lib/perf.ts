type PerfMeta = Record<string, unknown>;

const DEBUG_KEY = 'debugPerf';

function isEnabled(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

const starts = new Map<string, number>();

export const perf = {
  enabled: isEnabled,
  start(name: string, meta?: PerfMeta) {
    if (!isEnabled()) return;
    starts.set(name, nowMs());
    // eslint-disable-next-line no-console
    console.debug(`[perf:start] ${name}`, meta ?? {});
  },
  end(name: string, meta?: PerfMeta) {
    if (!isEnabled()) return;
    const start = starts.get(name);
    const durationMs = start != null ? nowMs() - start : null;
    // eslint-disable-next-line no-console
    console.debug(`[perf:end] ${name}`, { durationMs, ...(meta ?? {}) });
    starts.delete(name);
    return durationMs;
  },
};
