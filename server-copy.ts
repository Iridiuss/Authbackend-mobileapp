// server.ts
import express from 'express';
import mongoose, { Schema, Document, model } from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2'; // Import GitHub strategy.
import cors from 'cors';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();


const app = express();

// Add these lines
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow CORS from the Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// ====== MongoDB Setup ======
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// Configure nodemailer with Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    // Add these options to handle TLS
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

// Add a verification function to test the connection
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('SMTP connection established successfully');
  } catch (error) {
    console.error('SMTP connection failed:', error);
  }
}

// Call the verification function when starting the server
verifyEmailConfig();

// Define a User interface and schema
interface IUser extends Document {
  googleId?: string;  // Make optional since users might use GitHub
  githubId?: string;  // Add GitHub ID field
  twitterId?: string;
  linkedinId?: string;
  facebookId?: string;
  displayName: string;
  email?: string;  // Add email field
  password?: string;
  twoFactorCode?: string;
  twoFactorVerified?: boolean;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String },      // Make optional
  githubId: { type: String },      // Add GitHub ID field
  twitterId: { type: String },
  linkedinId: { type: String },
  facebookId: { type: String },
  displayName: { type: String, required: true },
  email: { type: String },  // Add email field
  password: { type: String },
  twoFactorCode: { type: String },
  twoFactorVerified: { type: Boolean, default: false },
});

const linkedinOptions: any = {
  clientID: 'YOUR_LINKEDIN_CLIENT_ID',
  clientSecret: 'YOUR_LINKEDIN_CLIENT_SECRET',
  callbackURL: 'http://localhost:3001/auth/linkedin/callback',
  scope: ['r_liteprofile', 'r_emailaddress'],
  state: true,
  profileURL: 'https://api.linkedin.com/v2/me',
};
const User = model<IUser>('User', userSchema);

// ====== Express Session Middleware ======
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));

// ====== Passport Setup ======
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// passport.deserializeUser((id: string, done) => {
//   User.findById(id, (err: any, user: IUser) => {
//     done(err, user);
//   });
// });

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


// ====== Google OAuth Strategy ======
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: 'http://localhost:3001/auth/google/callback',
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,  // Add email
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

// Update the GitHub Strategy implementation
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: 'http://localhost:3001/auth/github/callback',
},
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const existingUser = await User.findOne({ githubId: profile.id });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        githubId: profile.id,
        displayName: profile.username || profile.displayName || 'GitHub User',
        email: profile.emails?.[0]?.value,  // Add email
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

// ----- Twitter Strategy -----
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY!,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
  callbackURL: 'http://localhost:3001/auth/twitter/callback',
},
  async (token, tokenSecret, profile, done) => {
    try {
      const existingUser = await User.findOne({ twitterId: profile.id });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        twitterId: profile.id,
        displayName: profile.displayName,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  callbackURL: 'http://localhost:3001/auth/linkedin/callback',
  scope: ['r_liteprofile', 'r_emailaddress'],  // Make sure email scope is included
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ linkedinId: profile.id });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        linkedinId: profile.id,
        displayName: profile.displayName || 'LinkedIn User',
        email: profile.emails?.[0]?.value,  // Add email
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

// ----- Facebook Strategy -----
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID!,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  callbackURL: 'http://localhost:3001/auth/facebook/callback',
  profileFields: ['id', 'displayName']  // Removed emails from profileFields
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ facebookId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        facebookId: profile.id,
        displayName: profile.displayName
        // Removed email field
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

// ====== Routes ======

// Endpoint to get the current user
app.get('/api/current-user', (req, res) => {
  res.json({ user: req.user || null });
});

// Start Google OAuth flow
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // Successful authentication; redirect to the Next.js frontend.
    res.redirect('http://localhost:3000/profile');
  }
);

// ----- GitHub OAuth Routes -----
// Route to start the GitHub OAuth flow.
app.get('/auth/github', passport.authenticate('github', {
  scope: ['user:email']
}));

// Callback route for GitHub OAuth.
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // On success, redirect to the Next.js frontend.
    res.redirect('http://localhost:3000/profile');
  }
);

// --- Twitter Routes ---
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/auth/failure' }),
  (req, res) => { res.redirect('http://localhost:3000/profile'); }
);

// --- LinkedIn Routes ---
app.get('/auth/linkedin', passport.authenticate('linkedin', {
  scope: ['r_liteprofile', 'r_emailaddress']
}));
app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/auth/failure' }),
  (req, res) => { res.redirect('http://localhost:3000/profile'); }
);

// --- Facebook Routes ---
app.get('/auth/facebook', passport.authenticate('facebook')); // Removed scope
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/failure' }),
  (req, res) => { res.redirect('http://localhost:3000/profile'); }
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000');
  });
});

// Optional failure route
app.get('/auth/failure', (req, res) => {
  res.send('Authentication Failed');
});



app.post('/signup', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
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

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Account',
        text: `Your verification code is: ${twoFactorCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to Our App!</h1>
            <p>Please use the following code to verify your account:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;">
              <strong>${twoFactorCode}</strong>
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }

    return res.json({
      message: 'Signup initiated. Please check your email for verification code.',
      userId: newUser._id,
    });
  })().catch(next);
});

app.post('/signup/verify', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or verification code.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }
    if (user.twoFactorCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }
    if (user.twoFactorVerified) {
      return res.status(400).json({ error: 'Account already verified.' });
    }
    user.twoFactorVerified = true;
    user.twoFactorCode = undefined;
    await user.save();

    // Use a type assertion for req.login since its type may not exactly match
    (req as any).login(user, (err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Error logging in.' });
      }
      return res.json({
        message: 'Account verified successfully. You are now logged in.',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    });
  })().catch(next);
});

app.post('/login', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password.' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    if (!user.twoFactorVerified) {
      return res.status(400).json({ error: 'Please verify your account first.' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Remove the 2FA code generation and just log the user in
    (req as any).login(user, (err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Error logging in.' });
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName
        }
      });
    });
  })().catch(next);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
