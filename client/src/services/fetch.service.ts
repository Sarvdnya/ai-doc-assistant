export async function fetchWithDiagnostics(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const startedAt = performance.now();
  const body = typeof options.body === "string" ? options.body : "";

  console.log("[FETCH] URL:", url);
  console.log("[FETCH] METHOD:", options.method ?? "GET");
  console.log("[FETCH] BODY:", body);

  try {
    const response = await fetch(url, options);
    console.log("[FETCH] STATUS:", response.status);
    console.log("[FETCH] TIME:", `${Math.round(performance.now() - startedAt)}ms`);
    return response;
  } catch (error) {
    console.error("[FETCH FAILED] URL:", url);
    console.error("[FETCH FAILED] ERROR:", error instanceof Error ? error.message : String(error));
    console.error("[FETCH FAILED] STACK:", error instanceof Error ? error.stack : "No stack available");
    throw error;
  }
}
