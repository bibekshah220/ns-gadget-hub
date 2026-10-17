import crypto from "crypto";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/config/db";
import User from "@/models/User";

export const SESSION_COOKIE = "ns_session";

/* Session lifetime in minutes, overridable per environment. A missing or
   nonsensical value falls back rather than minting a token that never expires.
   Seven days is safe despite being long because requireAuth reloads the user on
   every request: a password reset bumps tokenVersion and kills live sessions
   immediately, so the TTL is not the revocation mechanism. */
const ttlMinutes = Number(process.env.SESSION_TTL_MINUTES);
const TOKEN_TTL_SECONDS =
  (Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : 7 * 24 * 60) * 60;

/* Read lazily so a missing secret fails the request, not the build. */
const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }

  return secret;
};

export const signSessionToken = (user) =>
  jwt.sign(
    { sub: String(user._id), role: user.role, v: user.tokenVersion ?? 0 },
    getSecret(),
    { expiresIn: TOKEN_TTL_SECONDS, algorithm: "HS256" },
  );

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
});

/* Applied to a NextResponse so the browser drops the session immediately. */
export const clearSessionCookie = (response) => {
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
};

const readToken = (req) => {
  const cookieToken = req.cookies?.get(SESSION_COOKIE)?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.get("authorization") || "";

  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

/**
 * Resolve the caller, returning the verified JWT payload alongside the user so
 * callers can decide whether the cookie is due for renewal.
 *
 * @returns {Promise<{user: object, payload: object}|null>}
 */
export const requireAuthSession = async (req) => {
  try {
    const token = readToken(req);

    if (!token) {
      return null;
    }

    const payload = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });

    await connectToDatabase();

    /* lean(): this runs on every authenticated request, and nothing downstream
       calls a document method on the result. */
    const user = await User.findById(payload.sub)
      .select("name email imageUrl role cartItems tokenVersion")
      .lean();

    if (!user || (user.tokenVersion ?? 0) !== payload.v) {
      return null;
    }

    return { user, payload };
  } catch {
    return null;
  }
};

/**
 * Re-issue the cookie once a session is past half its life, so someone who
 * keeps using the site is never signed out mid-visit. An idle session still
 * lapses on schedule.
 */
export const slideSession = (response, user, payload) => {
  const now = Math.floor(Date.now() / 1000);
  const halfLife = payload.exp - TOKEN_TTL_SECONDS / 2;

  if (now >= halfLife) {
    response.cookies.set(SESSION_COOKIE, signSessionToken(user), sessionCookieOptions());
  }

  return response;
};

/**
 * Resolve the caller to a live User document.
 *
 * The DB round trip is deliberate: it makes a role change, a deleted account,
 * and a password reset take effect on the very next request instead of when
 * the JWT happens to expire.
 *
 * @returns {Promise<object|null>} a plain object, not a mongoose document
 */
export const requireAuth = async (req) => (await requireAuthSession(req))?.user ?? null;

/* Password-reset tokens are random; only their hash is ever persisted. */
export const createResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return { token, tokenHash: hashResetToken(token) };
};

export const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/* Strip everything the client has no business seeing. */
export const publicUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  imageUrl: user.imageUrl,
  role: user.role,
  cartItems: user.cartItems || {},
});
