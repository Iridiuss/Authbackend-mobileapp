import { transporter } from '../config/email';

export class EmailService {
  static async sendVerificationEmail(email: string, code: string) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Account',
        text: `Your verification code is: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to AuthSystem by Soumya!</h1>
            <p>Please use the following code to verify your account:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;">
              <strong>${code}</strong>
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }
  }
}