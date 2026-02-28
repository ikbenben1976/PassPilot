import { FrontierClient } from './client.js';
import { FlightPipeline } from './pipeline.js';

export type { FrontierDataAdapter } from './adapter.js';
export { FrontierClient } from './client.js';
export { FrontierResponseParser } from './parser.js';
export { FlightPipeline } from './pipeline.js';

// ─── Singleton Pipeline ──────────────────────────────────────────────────────

let pipeline: FlightPipeline | null = null;

/**
 * Get the singleton FlightPipeline instance.
 * Lazily initialized with the live Frontier client.
 */
export function getPipeline(): FlightPipeline {
  if (!pipeline) {
    const client = new FrontierClient(
      Number(process.env.FRONTIER_REQUEST_INTERVAL_MS) || 1_000,
    );
    pipeline = new FlightPipeline(client);
  }
  return pipeline;
}

/**
 * Replace the pipeline (useful for testing with mock adapters).
 */
export function setPipeline(p: FlightPipeline): void {
  pipeline = p;
}
