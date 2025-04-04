# Authentication System Backend

This is the backend for an authentication system built with **Node.js**, **MongoDB**, **JWT**, and **bcrypt**. It supports multiple authentication strategies such as **Google**, **GitHub**, **Twitter**, **Facebook**, and **LinkedIn** using OAuth 2.0 and OpenID Connect. Additionally, the backend includes **2FA** (Two-Factor Authentication) functionality during the signup process.

## Features
- **OAuth Authentication**: Support for **Google**, **GitHub**, **Twitter**, **Facebook**, and **LinkedIn** authentication.
- **2FA for Signup**: Secure account creation with two-factor authentication via email.
- **JWT for Session Management**: JWT is used for managing authenticated sessions securely.
- **Password Hashing**: **bcrypt** is used for securely hashing passwords.
- **MongoDB**: MongoDB is used to store user data, including OAuth tokens and user details.

## Technologies Used
- **Node.js**: JavaScript runtime for building the backend application.
- **Express**: Web framework for Node.js for handling HTTP requests and middleware.
- **MongoDB**: NoSQL database used for storing user and session data.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB, used to model user data.
- **Passport.js**: Authentication middleware for Node.js supporting multiple strategies.
- **JWT (JSON Web Token)**: For securely managing user authentication and sessions.
- **bcrypt**: For securely hashing passwords.

## Prerequisites
Make sure you have the following installed:
- **Node.js** (v12 or higher)
- **MongoDB** (or use a MongoDB Atlas cloud instance)
- **npm** (Node Package Manager)

## Setup and Installation

### 1. Clone the repository
Clone the repository to your local machine using:

```bash
git clone https://github.com/your-username/authentication-system-backend.git
cd authentication-system-backend
2. Install dependencies
Install the required npm packages:


npm install
3. Set up environment variables
Create a .env file at the root of the project and add the following variables:

MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
TWITTER_CONSUMER_KEY=your-twitter-consumer-key
TWITTER_CONSUMER_SECRET=your-twitter-consumer-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:3001/auth/linkedin/callback
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-port
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:3000
4. Run the server
Once you have configured the .env file, you can start the server:

bash
Copy
npm start
The server will be running on http://localhost:3001.

Authentication Routes
1. OAuth Routes
Google: /auth/google

GitHub: /auth/github

Twitter: /auth/twitter

Facebook: /auth/facebook

LinkedIn: /auth/linkedin

2. Callback Routes
After the OAuth authentication, the users will be redirected to the callback routes for each provider:

Google: /auth/google/callback

GitHub: /auth/github/callback

Twitter: /auth/twitter/callback

Facebook: /auth/facebook/callback

LinkedIn: /auth/linkedin/callback

3. 2FA Routes
Signup with 2FA: /signup

Verify 2FA Code: /signup/verify

4. User Routes
Current User: /api/current-user

Logout: /logout

How Authentication Works
OAuth Authentication:

The client application requests authentication from the desired provider (Google, GitHub, etc.).

The user is redirected to the provider's login page, and after successful authentication, the provider sends an authorization code.

The backend exchanges this authorization code for an access token and retrieves the user's profile data.

2FA Authentication:

After the user signs up, a one-time verification code is sent to the user's email.

The user must enter the code to verify their account. Once verified, the user is logged in.

JWT Authentication:

Once authenticated, the backend generates a JWT for the session.

This JWT is stored in the user's session and used to authenticate subsequent requests.

MongoDB Database Schema
User Model
googleId: Google OAuth ID (optional)

githubId: GitHub OAuth ID (optional)

twitterId: Twitter OAuth ID (optional)

facebookId: Facebook OAuth ID (optional)

linkedinId: LinkedIn OAuth ID (optional)

displayName: The display name of the user

email: User's email (optional, fetched from OAuth provider)

password: Hashed password (for local signup)

twoFactorCode: Two-factor authentication code

twoFactorVerified: Boolean indicating if the user has verified their 2FA