import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection established successfully');
  } catch (error) {
    console.error('SMTP connection failed:', error);
  }
};