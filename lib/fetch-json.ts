export type JsonErrorPayload = {
  error?: string;
  message?: string;
  details?: Record<string, string[]>;
};

export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const data = await parseJsonResponse<T>(response);

  return { response, data };
}

export function getJsonErrorMessage(
  payload: unknown,
  fallbackMessage: string
) {
  if (payload && typeof payload === "object") {
    if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  }

  return fallbackMessage;
}
