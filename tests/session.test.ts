import assert from "node:assert/strict";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_COOKIE_FALLBACK_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  createSessionActivityUpdate,
  createSessionTimestamps,
  evaluateSessionTimeouts,
  getSessionCookieDeletionDefinitions,
  getSessionCookieName,
  getSessionCookieOptions,
} from "../lib/session-policy";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("session creation timestamps start together and idle touch only updates lastActivity", () => {
  const createdAt = new Date("2026-05-06T00:00:00.000Z");
  const timestamps = createSessionTimestamps(createdAt);

  assert.equal(timestamps.createdAt.getTime(), createdAt.getTime());
  assert.equal(timestamps.lastActivity.getTime(), createdAt.getTime());
  assert.equal(
    timestamps.expiresAt.getTime(),
    createdAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS
  );

  const nextActivity = new Date("2026-05-06T00:09:00.000Z");
  const touch = createSessionActivityUpdate(nextActivity);

  assert.deepEqual(Object.keys(touch), ["lastActivity"]);
  assert.equal(touch.lastActivity.getTime(), nextActivity.getTime());
  assert.equal(timestamps.createdAt.getTime(), createdAt.getTime());
});

runTest("request at 9 minutes remains valid and resets the idle window", () => {
  const createdAt = new Date("2026-05-06T00:00:00.000Z");
  const nineMinutesLater = new Date("2026-05-06T00:09:00.000Z");

  const beforeTouch = evaluateSessionTimeouts({
    createdAt,
    lastActivity: createdAt,
    now: nineMinutesLater,
  });

  assert.equal(beforeTouch.expired, false);

  const afterTouch = evaluateSessionTimeouts({
    createdAt,
    lastActivity: nineMinutesLater,
    now: new Date("2026-05-06T00:18:00.000Z"),
  });

  assert.equal(afterTouch.expired, false);
});

runTest("no request for 11 minutes expires the session for idle timeout", () => {
  const createdAt = new Date("2026-05-06T00:00:00.000Z");
  const elevenMinutesLater = new Date("2026-05-06T00:11:00.000Z");

  const result = evaluateSessionTimeouts({
    createdAt,
    lastActivity: createdAt,
    now: elevenMinutesLater,
  });

  assert.equal(result.expired, true);
  assert.equal(result.reason, "idle");
});

runTest("continuous activity still expires after the 30 minute absolute timeout", () => {
  const createdAt = new Date("2026-05-06T00:00:00.000Z");
  const twentyNineFiftyNine = new Date("2026-05-06T00:29:59.000Z");
  const thirtyOneMinutes = new Date("2026-05-06T00:31:00.000Z");

  const stillValid = evaluateSessionTimeouts({
    createdAt,
    lastActivity: new Date("2026-05-06T00:29:00.000Z"),
    now: twentyNineFiftyNine,
  });

  assert.equal(stillValid.expired, false);

  const expired = evaluateSessionTimeouts({
    createdAt,
    lastActivity: new Date("2026-05-06T00:30:30.000Z"),
    now: thirtyOneMinutes,
  });

  assert.equal(expired.expired, true);
  assert.equal(expired.reason, "absolute");
});

runTest("exact timeout boundaries remain valid", () => {
  const createdAt = new Date("2026-05-06T00:00:00.000Z");

  const idleBoundary = evaluateSessionTimeouts({
    createdAt,
    lastActivity: createdAt,
    now: new Date("2026-05-06T00:10:00.000Z"),
  });

  const absoluteBoundary = evaluateSessionTimeouts({
    createdAt,
    lastActivity: new Date("2026-05-06T00:20:01.000Z"),
    now: new Date("2026-05-06T00:30:00.000Z"),
  });

  assert.equal(idleBoundary.expired, false);
  assert.equal(absoluteBoundary.expired, false);
});

runTest("session cookie policy stays secure on proxied HTTPS requests", () => {
  const now = new Date("2026-05-06T00:00:00.000Z");
  const requestHeaders = new Headers({
    host: "barangay.example.gov.ph",
    "x-forwarded-proto": "https",
  });
  const cookieOptions = getSessionCookieOptions(requestHeaders, now);

  assert.equal(getSessionCookieName(requestHeaders), SESSION_COOKIE_NAME);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.secure, true);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(cookieOptions.path, "/");
  assert.equal(cookieOptions.maxAge, SESSION_COOKIE_OPTIONS.maxAge);
  assert.equal(
    cookieOptions.expires.getTime(),
    now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS
  );
});

runTest("session cookie policy falls back to a non-host cookie on localhost HTTP", () => {
  const now = new Date("2026-05-06T00:00:00.000Z");
  const requestHeaders = new Headers({
    host: "localhost:3000",
    origin: "http://localhost:3000",
  });
  const cookieOptions = getSessionCookieOptions(requestHeaders, now);

  assert.equal(getSessionCookieName(requestHeaders), SESSION_COOKIE_FALLBACK_NAME);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.secure, false);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(cookieOptions.path, "/");
  assert.equal(cookieOptions.maxAge, SESSION_COOKIE_OPTIONS.maxAge);
  assert.equal(
    cookieOptions.expires.getTime(),
    now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS
  );
});

runTest("session cookie cleanup clears both secure and localhost cookie variants", () => {
  const deletions = getSessionCookieDeletionDefinitions();

  assert.deepEqual(
    deletions.map((cookie) => cookie.name),
    [SESSION_COOKIE_NAME, SESSION_COOKIE_FALLBACK_NAME]
  );
  assert.equal(deletions[0].secure, true);
  assert.equal(deletions[1].secure, false);
  assert.equal(deletions[0].maxAge, 0);
  assert.equal(deletions[1].maxAge, 0);
  assert.equal(deletions[0].expires.getTime(), 0);
  assert.equal(deletions[1].expires.getTime(), 0);
});

console.log("Session tests completed successfully.");
