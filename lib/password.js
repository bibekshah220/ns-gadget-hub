/*
 * Password policy. Kept free of server-only imports so client components can
 * show the same rules the API enforces, without pulling mongoose into the
 * browser bundle.
 */
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * @returns {string|null} the unmet requirements, or null when acceptable
 */
export const passwordProblem = (password) => {
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required";
  }

  if (password.length > 200) {
    return "Password must be at most 200 characters";
  }

  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));

  if (failed.length === 0) {
    return null;
  }

  return `Password needs: ${failed.map((rule) => rule.label.toLowerCase()).join(", ")}`;
};
