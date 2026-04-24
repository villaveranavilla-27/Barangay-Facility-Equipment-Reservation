import { NextResponse } from "next/server";

export class ApiRouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

export function jsonError(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status }
  );
}

export function jsonMethodNotAllowed(allowedMethods: readonly string[]) {
  return NextResponse.json(
    {
      error: "Method not allowed",
      allowedMethods,
    },
    {
      status: 405,
      headers: {
        Allow: allowedMethods.join(", "),
      },
    }
  );
}

export function parseRouteParamId(value: string, label = "id") {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiRouteError(400, `Invalid ${label}`);
  }

  return parsed;
}

export async function readJsonBody<T>(request: Request) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    throw new ApiRouteError(400, "Request body is required.");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new ApiRouteError(400, "Request body must be valid JSON.");
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function handleApiRouteError(
  error: unknown,
  context: string,
  fallbackMessage = "Internal server error."
) {
  if (error instanceof ApiRouteError) {
    return jsonError(error.message, error.status, error.details);
  }

  console.error(context, error);
  return jsonError(fallbackMessage, 500);
}
