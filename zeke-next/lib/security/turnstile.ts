import "server-only";

import { headers } from "next/headers";

export type TurnstileAction = "login" | "register" | "password_reset";
export type TurnstileProtectedInput = { turnstileToken: string };

type SiteverifyResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ALWAYS_PASS_TEST_SECRET = "1x0000000000000000000000000000000AA";

function allowedHostnames(): Set<string> {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  const values = configured
    ? configured.split(",")
    : process.env.NODE_ENV === "production"
      ? ["zekesolution.com", "www.zekesolution.com"]
      : ["localhost", "127.0.0.1"];

  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

export async function verifyTurnstileToken(
  token: string,
  expectedAction: TurnstileAction,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  const normalizedToken = token.trim();
  if (!normalizedToken || normalizedToken.length > 2048) return false;

  const requestHeaders = await headers();
  const remoteIp =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: normalizedToken,
        remoteip: remoteIp || undefined,
        idempotency_key: crypto.randomUUID(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error("[turnstile] Siteverify returned HTTP", response.status);
      return false;
    }

    const result = (await response.json()) as SiteverifyResponse;
    const hostname = result.hostname?.toLowerCase();
    const usingOfficialDevelopmentTestKey =
      process.env.NODE_ENV !== "production" && secret === ALWAYS_PASS_TEST_SECRET;
    const valid =
      result.success === true &&
      (usingOfficialDevelopmentTestKey ||
        (result.action === expectedAction &&
          Boolean(hostname && allowedHostnames().has(hostname))));

    if (!valid) {
      console.warn("[turnstile] verification rejected", {
        expectedAction,
        receivedAction: result.action ?? null,
        hostname: result.hostname ?? null,
        errorCodes: result["error-codes"] ?? [],
      });
    }

    return valid;
  } catch (error) {
    console.error("[turnstile] Siteverify request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
}
