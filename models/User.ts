import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  githubId?: string;
  twitterId?: string;
  linkedinId?: string;
  facebookId?: string;
  displayName: string;
  email?: string;
  password?: string;
  twoFactorCode?: string;
  twoFactorVerified?: boolean;
  profilePhoto?: string;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String },
  githubId: { type: String },
  twitterId: { type: String },
  linkedinId: { type: String },
  facebookId: { type: String },
  displayName: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  twoFactorCode: { type: String },
  twoFactorVerified: { type: Boolean, default: false },
  profilePhoto: {
    type: String,
    required: false
  }
});

export const User = mongoose.model<IUser>('User', userSchema);