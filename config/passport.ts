import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import fetchLinkedInProfile from '../services/linkedin.service';
import { User, IUser } from '../models/User';
import { uploadImage } from '../services/image.service';

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
  console.log('Serialized User:', user);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized User:', user);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${process.env.BASE_URL2}/auth/google/callback`,
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      // Upload profile photo to Cloudinary if it exists
      let cloudinaryUrl;
      if (profile.photos?.[0]?.value) {
        cloudinaryUrl = await uploadImage(profile.photos[0].value);
      }

      const newUser = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        profilePhoto: cloudinaryUrl || undefined,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: `${process.env.BASE_URL2}/auth/github/callback`,
  scope: ['user', 'user:email'],
},
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('GitHub Profile:', profile);

      const existingUser = await User.findOne({ githubId: profile.id });
      if (existingUser) {
        if (profile.photos?.[0]?.value && profile.photos[0].value !== existingUser.profilePhoto) {
          try {
            const cloudinaryUrl = await uploadImage(profile.photos[0].value);
            existingUser.profilePhoto = cloudinaryUrl;
            await existingUser.save();
          } catch (uploadError) {
            console.error('Failed to update profile photo:', uploadError);
          }
        }
        return done(null, existingUser);
      }

      let cloudinaryUrl;
      if (profile.photos?.[0]?.value) {
        try {
          cloudinaryUrl = await uploadImage(profile.photos[0].value);
        } catch (uploadError) {
          console.error('Failed to upload profile photo:', uploadError);
        }
      }

      const newUser = new User({
        githubId: profile.id,
        displayName: profile.username || profile.displayName || 'GitHub User',
        email: profile.emails?.[0]?.value,
        profilePhoto: cloudinaryUrl || undefined,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      console.error('GitHub Strategy Error:', error);
      return done(error as Error, undefined);
    }
  }));

// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY!,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
  callbackURL: `${process.env.BASE_URL2}/auth/twitter/callback`,
},
  async (token, tokenSecret, profile, done) => {
    try {
      const existingUser = await User.findOne({ twitterId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      // Upload profile photo to Cloudinary if it exists
      let cloudinaryUrl;
      if (profile.photos?.[0]?.value) {
        // Remove '_normal' from Twitter image URL to get full-size image
        const fullSizeImageUrl = profile.photos[0].value.replace('_normal.', '.');
        cloudinaryUrl = await uploadImage(fullSizeImageUrl);
      }

      const newUser = new User({
        twitterId: profile.id,
        displayName: profile.displayName,
        profilePhoto: cloudinaryUrl || undefined,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));

// LinkedIn Strategy
// passport.use(new LinkedInStrategy({
//   clientID: process.env.LINKEDIN_CLIENT_ID!,
//   clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
//   callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/auth/linkedin/callback',
//   scope: ['r_liteprofile'],
// },
// async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ linkedinId: profile.id });
//     if (user) return done(null, user);
//     user = new User({
//       linkedinId: profile.id,
//       displayName: profile.displayName || 'LinkedIn User',
//       email: profile.emails ? profile.emails[0].value : undefined,
//     });
//     await user.save();
//     return done(null, user);
//   } catch (error) {
//     return done(error);
//   }
// }));


// LinkedIn OIDC Strategy
// Cast the strategy to any so we can use our extended verify callback signature.
// passport.use('linkedin', new (OpenIDConnectStrategy as any)({
//   issuer: 'https://www.linkedin.com',
//   authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
//   tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
//   userInfoURL: 'https://api.linkedin.com/v2/userinfo',
//   clientID: process.env.LINKEDIN_CLIENT_ID!,
//   clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
//   callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/auth/linkedin/callback',
//   scope: ['openid', 'profile', 'email'],
//   passReqToCallback: false,
// }, 
// async (issuer: string, sub: string, profile: any, accessToken: string, refreshToken: string, params: any, done: (err: any, user?: any) => void) => {
//   console.log('LinkedIn OIDC profile:', profile);
//   try {
//     // Optionally, fetch additional profile data using the access token
//     const extendedProfile = await fetchLinkedInProfile(accessToken);
//     console.log('Extended LinkedIn profile:', extendedProfile);

//     const finalDisplayName = profile.displayName ||
//       (extendedProfile.localizedFirstName && extendedProfile.localizedLastName
//         ? `${extendedProfile.localizedFirstName} ${extendedProfile.localizedLastName}`
//         : 'LinkedIn User');

//     let user = await User.findOne({ linkedinId: profile.id });
//     if (user) return done(null, user);

//     user = new User({
//       linkedinId: profile.id,
//       displayName: finalDisplayName,
//       email: profile.emails && profile.emails[0] ? profile.emails[0].value : undefined,
//     });
//     await user.save();
//     return done(null, user);
//   } catch (error) {
//     return done(error);
//   }
// }));

// passport.use('linkedin', new (OpenIDConnectStrategy as any)({
//   issuer: 'https://www.linkedin.com/',
//   authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
//   tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
//   // Use the endpoint provided by your LinkedIn OIDC product
//   userInfoURL: 'https://api.linkedin.com/v2/userinfo',
//   clientID: process.env.LINKEDIN_CLIENT_ID!,
//   clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
//   callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/auth/linkedin/callback',
//   scope: ['openid', 'profile', 'email'],
//   passReqToCallback: false,
// }, async (issuer: string, sub: string, profile: any, accessToken: string, refreshToken: string, params: any, done: (err: any, user?: any) => void) => {
//   console.log('LinkedIn OIDC profile:', profile);
//   console.log('Raw token params:', params);
//   try {
//     const extendedProfile = await fetchLinkedInProfile(accessToken, issuer);
//     console.log('Extended LinkedIn profile:', extendedProfile);

//     const linkedinId = profile.sub;
//     const displayName = profile.name || (extendedProfile.given_name && extendedProfile.family_name
//       ? `${extendedProfile.given_name} ${extendedProfile.family_name}`
//       : 'LinkedIn User');
//     const email = profile.email || (extendedProfile.email ? extendedProfile.email : undefined);

//     // Upload profile photo to Cloudinary if it exists
//     let cloudinaryUrl;
//     if (profile.picture || extendedProfile.picture) {
//       cloudinaryUrl = await uploadImage(profile.picture || extendedProfile.picture);
//     }

//     let user = await User.findOne({ linkedinId });
//     if (user) return done(null, user);

//     user = new User({
//       linkedinId,
//       displayName,
//       email,
//       profilePhoto: cloudinaryUrl || undefined,
//     });
//     await user.save();
//     return done(null, user);
//   } catch (error) {
//     return done(error);
//   }
// }));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID!,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  callbackURL: `${process.env.BASE_URL2}/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'photos'], // Added photos to profileFields
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ facebookId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      // Upload profile photo to Cloudinary if it exists
      let cloudinaryUrl;
      if (profile.photos?.[0]?.value) {
        cloudinaryUrl = await uploadImage(profile.photos[0].value);
      }

      const newUser = new User({
        facebookId: profile.id,
        displayName: profile.displayName,
        profilePhoto: cloudinaryUrl || undefined,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));

// Add type declarations for Passport session handling
declare global {
  namespace Express {
    interface User extends IUser { }
  }
}

export default passport;
