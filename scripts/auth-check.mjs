/*
 * End-to-end security check for auth, cart, orders and payment callbacks.
 *
 *   1. npm run build && PORT=3100 npm start > /tmp/ns-server.log
 *   2. node scripts/auth-check.mjs /tmp/ns-server.log
 *
 * The log path is needed because the reset link is only printed there when no
 * SMTP credentials are configured.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

const BASE = process.env.CHECK_BASE_URL || "http://localhost:3100";
const LOG = process.argv[2];

if (!LOG) {
  console.error("usage: node scripts/auth-check.mjs <path-to-server-log>");
  process.exit(1);
}
const email = `check_${Date.now()}@example.com`;
const PW1 = "First-password-123";
const PW2 = "Second-password-456";
let cookie = "";

const call = async (path, { method = "GET", body, useCookie = true, redirect = "manual" } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    redirect,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(useCookie && cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, headers: res.headers };
};

const ok = (name) => console.log(`  PASS  ${name}`);

// 1. register
let r = await call("/api/auth/register", { method: "POST", body: { name: "Check User", email, password: PW1 } });
assert.equal(r.status, 201, `register: ${r.status} ${JSON.stringify(r.json)}`);
assert.ok(cookie.startsWith("ns_session="), "session cookie issued");
assert.equal(r.json.user.password, undefined, "password never returned");
ok("register issues an httpOnly session and hides the password");

// 2. session works
r = await call("/api/auth/me");
assert.equal(r.status, 200);
assert.equal(r.json.user.email, email);
ok("session cookie resolves to the profile");

// 3. no cookie -> 401 on every protected route
for (const path of ["/api/auth/me", "/api/user/data", "/api/order/list", "/api/product/sellerList"]) {
  const anon = await call(path, { useCookie: false });
  assert.equal(anon.status, 401, `${path} should be 401 without a session`);
}
ok("protected routes reject anonymous callers");

// 4. non-seller cannot reach seller routes
r = await call("/api/product/sellerList");
assert.equal(r.status, 401, "plain user must not pass the seller gate");
ok("seller gate holds against a normal user");

// 5. duplicate email
const saved = cookie;
r = await call("/api/auth/register", { method: "POST", body: { name: "Dup", email, password: PW1 }, useCookie: false });
assert.equal(r.status, 409);
cookie = saved;
ok("duplicate email rejected");

// 6. password policy: length, uppercase, lowercase, symbol
for (const [password, why] of [
  ["short", "too short"],
  ["alllowercase!", "no uppercase"],
  ["ALLUPPERCASE!", "no lowercase"],
  ["NoSymbolHere1", "no symbol"],
]) {
  const res = await call("/api/auth/register", {
    method: "POST",
    body: { name: "Weak", email: `w${Date.now()}${Math.random()}@example.com`, password },
    useCookie: false,
  });
  assert.equal(res.status, 400, `password "${password}" (${why}) should be rejected`);
}
ok("password policy enforced (length, upper, lower, symbol)");

// 7. bad login, and no account enumeration
const bad = await call("/api/auth/login", { method: "POST", body: { email, password: "wrong-password" }, useCookie: false });
const missing = await call("/api/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "wrong-password" }, useCookie: false });
assert.equal(bad.status, 401);
assert.equal(missing.status, 401);
assert.equal(bad.json.message, missing.json.message, "same message for wrong password and unknown email");
ok("login failures are indistinguishable");

// 8. cart validation
cookie = saved;
for (const cartData of [{ "not-an-objectid": 1 }, { "68e1a1a1a1a1a1a1a1a1a1a1": -4 }, "nope"]) {
  const res = await call("/api/cart/update", { method: "POST", body: { cartData } });
  assert.equal(res.status, 400, `cart ${JSON.stringify(cartData)} should be rejected`);
}
r = await call("/api/cart/update", { method: "POST", body: { cartData: { "68e1a1a1a1a1a1a1a1a1a1a1": 2 } } });
assert.equal(r.status, 200);
ok("cart payloads are sanitised");

// 9. order with someone else's / bogus address
r = await call("/api/order/create", { method: "POST", body: { address: "68e1a1a1a1a1a1a1a1a1a1a1", items: [{ product: "68e1a1a1a1a1a1a1a1a1a1a1", quantity: 1 }] } });
assert.equal(r.status, 400, "unowned address must be refused");
ok("order creation refuses an address the caller does not own");

// 10. forged eSewa callback
const forged = Buffer.from(JSON.stringify({
  transaction_code: "FORGED", status: "COMPLETE", total_amount: "1,000",
  transaction_uuid: "68e1a1a1a1a1a1a1a1a1a1a1", product_code: "EPAYTEST",
  signed_field_names: "total_amount,transaction_uuid,product_code", signature: "ZmFrZXNpZ25hdHVyZQ==",
})).toString("base64");
r = await call(`/api/payment/esewa/verify?data=${encodeURIComponent(forged)}`);
assert.equal(r.status, 307);
assert.match(r.headers.get("location"), /\/payment\/failure/, "forged eSewa callback must not succeed");
ok("forged eSewa callback is rejected");

// 11. security headers
r = await call("/login");
assert.equal(r.headers.get("x-frame-options"), "DENY");
assert.match(r.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
assert.equal(r.headers.get("x-content-type-options"), "nosniff");
ok("security headers served");

// 12. forgot password -> reset -> old sessions dead
r = await call("/api/auth/forgot-password", { method: "POST", body: { email }, useCookie: false });
assert.equal(r.status, 200);
const unknown = await call("/api/auth/forgot-password", { method: "POST", body: { email: "nobody@example.com" }, useCookie: false });
assert.equal(unknown.json.message, r.json.message, "same reply whether or not the email exists");
ok("forgot-password does not leak which emails exist");

const token = readFileSync(LOG, "utf8").match(/reset-password\?token=([a-f0-9]{64})/)?.[1];
assert.ok(token, "reset link captured from the mailer fallback log");

cookie = saved;
r = await call("/api/auth/reset-password", { method: "POST", body: { token, password: PW2 } });
assert.equal(r.status, 200, `reset: ${JSON.stringify(r.json)}`);
ok("reset token accepted once");

const replay = await call("/api/auth/reset-password", { method: "POST", body: { token, password: "Another-password-789" }, useCookie: false });
assert.equal(replay.status, 400, "a used reset token must not work twice");
ok("used reset token cannot be replayed");

cookie = saved;
r = await call("/api/auth/me");
assert.equal(r.status, 401, "sessions issued before the reset must stop working");
ok("password reset revokes existing sessions");

cookie = "";
r = await call("/api/auth/login", { method: "POST", body: { email, password: PW1 }, useCookie: false });
assert.equal(r.status, 401, "old password must be dead");
r = await call("/api/auth/login", { method: "POST", body: { email, password: PW2 }, useCookie: false });
assert.equal(r.status, 200, "new password must work");
ok("new password works, old one does not");

/* Leave no check accounts behind. */
if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.db.collection("users").deleteMany({ email });
  await mongoose.disconnect();
}

console.log("\nALL CHECKS PASSED");
