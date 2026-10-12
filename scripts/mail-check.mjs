/*
 * Verify SMTP settings: npm run check:mail -- you@example.com
 *
 * Without an address it only logs in to the SMTP server. With one it also
 * sends a real message, which is the only way to prove delivery works.
 */
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
const to = process.argv[2];

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`\nNot configured. Empty in .env: ${missing.join(", ")}`);
  console.error("Password reset links will print to the server console instead.\n");
  process.exit(1);
}

const port = Number(SMTP_PORT) || 587;

console.log(`\n  host ${SMTP_HOST}:${port}   user ${SMTP_USER}   from ${SMTP_FROM || SMTP_USER}`);

if (/\s/.test(SMTP_PASS)) {
  console.log("  note: SMTP_PASS contains spaces. Google displays the app password in");
  console.log("        four blocks, but it must be stored as 16 characters with no spaces.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  await transporter.verify();
  console.log("  OK    login accepted");
} catch (error) {
  console.error(`  FAIL  login rejected: ${error.message}`);

  if (error.message.includes("Username and Password not accepted")) {
    console.error(`
  Gmail refuses normal account passwords over SMTP. SMTP_PASS must be a
  16-character App Password, which requires 2-Step Verification to be on:
  myaccount.google.com/apppasswords
`);
  }

  process.exit(1);
}

if (!to) {
  console.log("\n  Login works. To send a real test message:");
  console.log("  npm run check:mail -- you@example.com\n");
  process.exit(0);
}

const info = await transporter.sendMail({
  from: SMTP_FROM || SMTP_USER,
  to,
  subject: "N.S Gadget Hub SMTP check",
  text: "If this arrived, password reset emails will send correctly.",
});

console.log(`  OK    sent to ${to}  (id ${info.messageId})`);
console.log("\n  Check the inbox, and the spam folder if it is not there.\n");
