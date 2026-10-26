import type { IncomingMessage, ServerResponse } from "node:http";
import { TLSSocket } from "node:tls";
import { ZodError, type ZodType } from "zod";

import { SESSION_COOKIE, type SessionContext } from "../auth.server.js";

export type ApiRequest = IncomingMessage & { body?: unknown };
export type ApiResponse = ServerResponse<IncomingMessage>;
export type ApiHandler = (request: ApiRequest, response: ApiResponse) => Promise<void>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function apiHandler(handler: ApiHandler) {
  return async (request: ApiRequest, response: ApiResponse) => {
    try {
      await handler(request, response);
    } catch (error) {
      if (error instanceof ZodError) {
        json(response, 400, { error: error.issues[0]?.message ?? "Invalid request" });
        return;
      }
      if (error instanceof SyntaxError) {
        json(response, 400, { error: "Request body must be valid JSON" });
        return;
      }
      if (error instanceof ApiError) {
        json(response, error.status, { error: error.message });
        return;
      }
      if (error instanceof Error && error.message === "Unauthorized") {
        json(response, 401, { error: error.message });
        return;
      }
      if (error instanceof Error && error.message === "Invalid username/email or password") {
        json(response, 401, { error: error.message });
        return;
      }
      if (
        error instanceof Error &&
        (error.message === "Username or email is already registered" ||
          error.message === "Company profile already exists")
      ) {
        json(response, 409, { error: error.message });
        return;
      }

      console.error(error);
      json(response, 500, { error: "Internal server error" });
    }
  };
}

export function json(response: ApiResponse, status: number, data: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.end(JSON.stringify(data));
}

export function methodNotAllowed(response: ApiResponse, allowed: string[]) {
  response.setHeader("Allow", allowed.join(", "));
  json(response, 405, { error: "Method not allowed" });
}

function assertSameOriginJsonRequest(request: ApiRequest) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
    ?.split(",")[0]
    ?.trim();
  const scheme = protocol ?? (request.socket instanceof TLSSocket ? "https" : "http");

  if (
    typeof origin !== "string" ||
    typeof host !== "string" ||
    (scheme !== "http" && scheme !== "https")
  ) {
    throw new ApiError("Request origin is not allowed", 403);
  }

  let requestOrigin: string;
  let suppliedOrigin: string;
  try {
    requestOrigin = new URL(`${scheme}://${host}`).origin;
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.origin !== origin) {
      throw new Error("Invalid origin");
    }
    suppliedOrigin = parsedOrigin.origin;
  } catch {
    throw new ApiError("Request origin is not allowed", 403);
  }

  if (suppliedOrigin !== requestOrigin) {
    throw new ApiError("Request origin is not allowed", 403);
  }

  const contentType = request.headers["content-type"];
  if (typeof contentType !== "string" || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new ApiError("Content-Type must be application/json", 415);
  }
}

export function sessionContext(request: ApiRequest, response: ApiResponse): SessionContext {
  const cookieHeader = request.headers.cookie;
  const cookies = Array.isArray(cookieHeader) ? cookieHeader.join(";") : (cookieHeader ?? "");
  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  return {
    getToken: () => token,
    setToken: (value, maxAge) => {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      response.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
      );
    },
    clearToken: () => {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      response.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
      );
    },
  };
}

export async function readJson<T>(request: ApiRequest, schema: ZodType<T>): Promise<T> {
  assertSameOriginJsonRequest(request);

  let body = request.body;

  if (body === undefined) {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) throw new ApiError("Request body is required", 400);
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } else if (typeof body === "string") {
    body = JSON.parse(body);
  }

  return schema.parse(body);
}
