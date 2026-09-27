import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, code: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
  await transporter.sendMail({ from: SMTP_FROM, to, subject: "Your NISE COMPORT verification code", text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`, html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#202923"><p style="color:#24533c;font-weight:bold;letter-spacing:2px">NISE COMPORT</p><h1 style="font-size:24px">Verify your email</h1><p>Enter this code to continue. It expires in 10 minutes.</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f7f5ed;padding:18px;text-align:center">${code}</p><p style="color:#737970;font-size:13px">If you did not request this, you can ignore this email.</p></div>` });
}

export async function sendStatusEmail(to: string, name: string, reference: string, label: string, status: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
  await transporter.sendMail({ from: SMTP_FROM, to, subject: `NISE COMPORT update for ${reference}`, text: `Hello ${name},\n\nYour ${label} (${reference}) is now marked “${status}”. Sign in to your NISE COMPORT profile for details.\n\nNISE COMPORT Service Desk` });
}
