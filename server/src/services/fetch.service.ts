export class FetchRequestError extends Error {
  constructor(
    public readonly service: string,
    public readonly url: string,
    public readonly status?: number,
    public readonly responseBody?: string,
    cause?: unknown
  ) {
    const details = [
      `[${service}] Request failed`,
      `Service: ${service}`,
      `URL: ${url}`,
      status === undefined
        ? `Network Error: ${cause instanceof Error ? cause.message : String(cause ?? "Unknown network failure")}`
        : `Status: ${status}`,
      responseBody ? `Response: ${responseBody}` : "",
    ].filter(Boolean);

    super(details.join("\n"), cause === undefined ? undefined : { cause });
    this.name = "FetchRequestError";
  }
}

function formatBody(body: RequestInit["body"]): string {
  if (typeof body === "string") return body;
  if (body === undefined || body === null) return "";
  return "[non-text request body]";
}

/** Makes an HTTP request with the diagnostics needed to debug pipeline failures. */
export async function fetchWithDiagnostics(
  service: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  console.log("----------------------------------------");
  console.log("[FETCH] URL:", url);
  console.log("[FETCH] METHOD:", options.method ?? "GET");
  console.log("[FETCH] BODY:", formatBody(options.body));
  console.log("----------------------------------------");

  const startedAt = performance.now();

  try {
    const response = await fetch(url, options);
    console.log("----------------------------------------");
    console.log("[FETCH] STATUS:", response.status);
    console.log("[FETCH] TIME:", `${Math.round(performance.now() - startedAt)}ms`);
    console.log("----------------------------------------");
    return response;
  } catch (error) {
    console.error("----------------------------------------");
    console.error("[FETCH FAILED] URL:", url);
    console.error("[FETCH FAILED] ERROR:", error instanceof Error ? error.message : String(error));
    console.error("[FETCH FAILED] STACK:", error instanceof Error ? error.stack : "No stack available");
    console.error("----------------------------------------");

    throw new FetchRequestError(service, url, undefined, undefined, error);
  }
}

export async function throwForFailedResponse(
  service: string,
  url: string,
  response: Response
): Promise<void> {
  if (response.ok) return;

  const responseBody = await response.text().catch(() => "Unable to read response body");
  throw new FetchRequestError(service, url, response.status, responseBody.slice(0, 2_000));
}
