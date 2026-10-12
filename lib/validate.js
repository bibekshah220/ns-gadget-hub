import mongoose from "mongoose";

/* Re-exported so API routes keep a single validation import. */
export { PASSWORD_RULES, passwordProblem } from "@/lib/password";

/* Deliberately permissive: real validation is the mail that never arrives. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (value) =>
  typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);

export const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export const cleanString = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";
