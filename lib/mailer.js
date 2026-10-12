import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
  const mailer = getTransporter();

  if (!mailer) {
    /* No SMTP configured: log the link so local development still works. */
    console.warn(`[mailer] SMTP not configured. Reset link for ${to}: ${resetUrl}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your N.S Gadget Hub password",
    text: `Open this link to set a new password (valid for 30 minutes):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Open this link to set a new password. It is valid for 30 minutes.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, ignore this email.</p>`,
  });
};

/* Escaped because the body is whatever a stranger typed into the form. */
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const sendContactNotification = async ({ name, email, subject, message }) => {
  const mailer = getTransporter();
  const inbox = process.env.CONTACT_INBOX || process.env.SMTP_USER;

  if (!mailer || !inbox) {
    console.warn(`[contact] ${name} <${email}> - ${subject}\n${message}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: inbox,
    replyTo: `${name} <${email}>`,
    subject: `Contact form: ${subject}`,
    text: `${name} <${email}>\n\n${message}`,
    html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
<p><em>${escapeHtml(subject)}</em></p>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
  });
};
