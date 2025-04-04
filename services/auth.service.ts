import { User } from '../models/User';
import bcrypt from 'bcrypt';
import { EmailService } from './email.service';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  private static generateToken(user: any) {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static async signup(email: string, password: string, displayName: string) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      email,
      password: hashedPassword,
      displayName,
      twoFactorCode,
      twoFactorVerified: false,
    });
    await newUser.save();

    await EmailService.sendVerificationEmail(email, twoFactorCode);
    return newUser;
  }

  static async verify(email: string, code: string, res: Response) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.twoFactorCode !== code) {
      throw new Error('Invalid verification code');
    }
    if (user.twoFactorVerified) {
      throw new Error('Account already verified');
    }

    user.twoFactorVerified = true;
    user.twoFactorCode = undefined;
    await user.save();

    const token = this.generateToken(user);
    console.log('JWT Token generated:', token); // Log the token

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return user;
  }

  static async login(email: string, password: string, res: Response) {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }
    if (!user.twoFactorVerified) {
      throw new Error('Please verify your account first');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    console.log('JWT Token generated:', token); // Log the token

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return user;
  }
}