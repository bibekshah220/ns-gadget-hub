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

/* Copy for the two moments the buyer is told about by email. Any other
   transition is visible on /my-orders but does not warrant a message. */
const ORDER_EMAILS = {
  approved: {
    subject: (reference) => `Your order ${reference} is approved`,
    line: "The seller has approved your order and is preparing it for dispatch.",
  },
  completed: {
    subject: (reference) => `Your order ${reference} is complete`,
    line: "Your order is complete. Thank you for shopping with N.S Gadget Hub.",
  },
};

export const sendOrderStatusEmail = async ({ to, name, orderId, status, trackUrl }) => {
  const copy = ORDER_EMAILS[status];

  if (!copy) {
    return;
  }

  const reference = String(orderId).slice(-8).toUpperCase();
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(`[mailer] SMTP not configured. Order ${reference} -> ${status} for ${to}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: copy.subject(reference),
    text: `Hi ${name},\n\n${copy.line}\n\nTrack it here: ${trackUrl}\n\nOrder reference: ${reference}`,
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>${copy.line}</p>
<p><a href="${trackUrl}">Track your order</a></p>
<p>Order reference: ${reference}</p>`,
  });
};
