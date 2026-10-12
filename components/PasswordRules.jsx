"use client";
import { PASSWORD_RULES } from "@/lib/password";

/* Reads the same rule list the API enforces, so the hint cannot drift from
   the actual policy. */
const PasswordRules = ({ value = "" }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
    {PASSWORD_RULES.map(({ label, test }) => {
      const met = value.length > 0 && test(value);

      return (
        <li
          key={label}
          className={met ? "text-green-700" : "text-gray-500"}
        >
          <span aria-hidden="true">{met ? "✓" : "•"}</span> {label}
        </li>
      );
    })}
  </ul>
);

export default PasswordRules;
