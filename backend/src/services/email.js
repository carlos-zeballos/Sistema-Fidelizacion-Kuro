import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send OTP code via email
 */
export async function sendOTPEmail(email, code) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Código de verificación - Sistema de Fidelización',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Código de Verificación</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
      </div>
    `,
    text: `Tu código de verificación es: ${code}\n\nEste código expira en 10 minutos.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send push notification email (optional)
 */
export async function sendNotificationEmail(email, title, message) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
      </div>
    `,
    text: `${title}\n\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
}


