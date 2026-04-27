export async function readApiJson<T = Record<string, unknown>>(
  response: Response,
  fallbackMessage = "API request failed"
): Promise<T> {
  const rawBody = await response.text();
  let payload: unknown = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error(response.ok ? "API returned invalid JSON." : fallbackMessage);
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : fallbackMessage;

    throw new Error(errorMessage);
  }

  return payload as T;
}
