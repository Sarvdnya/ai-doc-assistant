export function enterTrace(name: string): () => void {
  const label = `[TIME] ${name}`;
  console.log(`[STEP] ENTER ${name}`);
  console.time(label);
  return () => {
    console.timeEnd(label);
    console.log(`[STEP] EXIT ${name}`);
  };
}

export async function traceAwait<T>(
  currentFunction: string,
  currentLine: string,
  operation: string,
  promise: Promise<T>
): Promise<T> {
  const label = `[TIME] ${operation}`;
  console.log(`[STEP] Calling ${operation}`);
  console.time(label);
  const timer = setTimeout(() => {
    console.error("[HANG DETECTED]");
    console.error("Current function:", currentFunction);
    console.error("Current line:", currentLine);
  }, 5_000);
  try {
    const result = await promise;
    console.log(`[STEP] Returned from ${operation}`);
    return result;
  } finally {
    clearTimeout(timer);
    console.timeEnd(label);
  }
}
