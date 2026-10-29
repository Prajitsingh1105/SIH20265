import nodemailer from 'nodemailer';
import { ENV } from './env';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: false,
  ignoreTLS: true,
});

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Failed to send email to ${to} (Mailpit may be offline):`, (error as Error).message);
    return false;
  }
}
