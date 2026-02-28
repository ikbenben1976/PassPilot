import type { FrontierDataAdapter } from './adapter.js';
import { FrontierClient } from './client.js';
import { MockAdapter } from './mockAdapter.js';
import { FlightPipeline } from './pipeline.js';

export type { FrontierDataAdapter } from './adapter.js';
export { FrontierClient } from './client.js';
export { MockAdapter } from './mockAdapter.js';
export { FrontierResponseParser } from './parser.js';
export { FlightPipeline } from './pipeline.js';
export { randomUserAgent, browserHeaders } from './userAgents.js';

// ─── Singleton Pipeline ──────────────────────────────────────────────────────

let pipeline: FlightPipeline | null = null;

/**
 * Get the singleton FlightPipeline instance.
 *
 * Adapter selection (checked in order):
 *   FRONTIER_USE_MOCK=true  → always use MockAdapter
 *   FRONTIER_USE_MOCK=false → always use live FrontierClient
 *   (unset)                 → try live health-check, fall back to mock
 */
export function getPipeline(): FlightPipeline {
  if (!pipeline) {
    const envFlag = process.env.FRONTIER_USE_MOCK;
    let adapter: FrontierDataAdapter;

    if (envFlag === 'true') {
      console.log('[Pipeline] Using mock Frontier data adapter (FRONTIER_USE_MOCK=true)');
      adapter = new MockAdapter();
    } else if (envFlag === 'false') {
      console.log('[Pipeline] Using live Frontier booking client (FRONTIER_USE_MOCK=false)');
      adapter = new FrontierClient(
        Number(process.env.FRONTIER_REQUEST_INTERVAL_MS) || 1_500,
      );
    } else {
      // Auto-detect: probe the live booking engine; fall back to mock on failure
      const client = new FrontierClient(
        Number(process.env.FRONTIER_REQUEST_INTERVAL_MS) || 1_500,
      );
      adapter = client;

      // Fire-and-forget probe — swap to mock if live API is unreachable
      client.healthCheck().then(({ healthy }) => {
        if (!healthy && pipeline) {
          console.warn('[Pipeline] Frontier API unreachable — switching to mock adapter');
          pipeline = new FlightPipeline(new MockAdapter());
        }
      }).catch(() => {
        if (pipeline) {
          console.warn('[Pipeline] Frontier API unreachable — switching to mock adapter');
          pipeline = new FlightPipeline(new MockAdapter());
        }
      });
    }

    pipeline = new FlightPipeline(adapter);
  }
  return pipeline;
}

/**
 * Replace the pipeline (useful for testing with mock adapters).
 */
export function setPipeline(p: FlightPipeline): void {
  pipeline = p;
}
