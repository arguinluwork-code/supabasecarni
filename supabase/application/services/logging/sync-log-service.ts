/**
 * Application-layer logging and execution timing helpers.
 */
export function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

export function elapsedSeconds(start: number): number {
  return (Date.now() - start) / 1000;
}
