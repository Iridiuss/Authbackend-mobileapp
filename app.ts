import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { sessionConfig } from './config/session';
import authRoutes from './routes/auth';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error';
import { User } from './models/User';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  // since ngrok is https
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none'  // important for cross-origin requests
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// 6. Passport configuration
passport.serializeUser((user: any, done) => {
  console.log('\n--- Serializing User ---');
  console.log('User to serialize:', user);
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  console.log('\n--- Deserialize Attempt ---');
  console.log('Attempting to deserialize user with ID:', id);
  try {
    const user = await User.findById(id);
    console.log('Database query result:', user);
    
    if (!user) {
      console.log('No user found with ID:', id);
      return done(null, false);
    }
    
    console.log('Successfully deserialized user:', user.displayName);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err, null);
  }
});

app.use('/auth', authRoutes);
app.use(errorHandler);

export default app;