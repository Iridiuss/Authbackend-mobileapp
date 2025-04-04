import express from 'express';
import { AuthService } from '../services/auth.service';
import { Request, Response, NextFunction } from 'express';
import configpassport from "../config/passport"

const router = express.Router();

// Local Authentication Routes
router.post('/signup', (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        try {
            const { email, password, displayName } = req.body;
            if (!email || !password || !displayName) {
                return res.status(400).json({ error: 'Missing required fields.' });
            }

            const user = await AuthService.signup(email, password, displayName);
            res.json({
                message: 'Signup initiated. Please check your email for verification code.',
                userId: user._id,
            });
        } catch (error) {
            next(error);
        }
    })().catch(next);
});

router.post('/signup/verify', (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Missing email or verification code.' });
            }

            const user = await AuthService.verify(email, code, res);
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
        } catch (error) {
            next(error);
        }
    })().catch(next);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password.' });
            }

            const user = await AuthService.login(email, password, res);
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
        } catch (error) {
            next(error);
        }
    })().catch(next);
});

// OAuth Routes
// Google OAuth
router.get('/google', configpassport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    (req: Request, res: Response, next: NextFunction) => {
        configpassport.authenticate('google', (err: any, user: any, info: any) => {
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect('auth-mobileapp://auth/callback?error=' + encodeURIComponent(err.message));
            }

            if (!user) {
                console.error('No user found:', info);
                return res.redirect('auth-mobileapp://auth/callback');
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error('Login error:', loginErr);
                    return res.redirect('auth-mobileapp://auth/callback');
                }

                // Force session save before redirect
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error('Session save error:', saveErr);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }

                    console.log('\n--- Auth Callback Debug ---');
                    console.log('Session after auth:', req.session);
                    console.log('Session ID:', req.sessionID);
                    console.log('Passport data in session:', (req.session as any).passport);
                    console.log('Is authenticated?:', req.isAuthenticated());

                    // Only redirect after session is saved
                    return res.redirect('auth-mobileapp://auth/callback');
                });
            });
        })(req, res, next);
    }
);

// GitHub OAuth
router.get('/github', configpassport.authenticate('github', {
    scope: ['user:email']
}));

router.get('/github/callback',
    (req: Request, res: Response, next: NextFunction) => {
        configpassport.authenticate('github', (err: any, user: any, info: any) => {
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect('auth-mobileapp://auth/callback?error=' + encodeURIComponent(err.message));
            }

            if (!user) {
                console.error('No user found:', info);
                return res.redirect('auth-mobileapp://auth/callback?error=auth_failed');
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error('Login error:', loginErr);
                    return res.redirect('auth-mobileapp://auth/callback?error=login_failed');
                }

                // Add a success parameter to help frontend detect successful auth
                return res.redirect('auth-mobileapp://auth/callback?auth=success');
            });
        })(req, res, next);
    }
);

// Twitter OAuth
router.get('/twitter', configpassport.authenticate('twitter'));

router.get('/twitter/callback',
    (req: Request, res: Response, next: NextFunction) => {
        configpassport.authenticate('twitter', (err: any, user: any, info: any) => {
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect('auth-mobileapp://auth/callback' + encodeURIComponent(err.message));
            }

            if (!user) {
                console.error('No user found:', info);
                return res.redirect('auth-mobileapp://auth/callback');
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error('Login error:', loginErr);
                    return res.redirect('auth-mobileapp://auth/callback');
                }

                // Add a success parameter to help frontend detect successful auth
                return res.redirect('auth-mobileapp://auth/callback');
            });
        })(req, res, next);
    }
);

// LinkedIn OAuth
// router.get('/linkedin', configpassport.authenticate('linkedin', {
//     scope: ['r_liteprofile'],
// }));

// router.get('/linkedin/callback',
//     configpassport.authenticate('linkedin', { failureRedirect: '/auth/failure' }),
//     (req: Request, res: Response) => {
//         res.redirect('http://localhost:3000/profile');
//     }
// );

// Initiate LinkedIn OIDC authentication
router.get('/linkedin', configpassport.authenticate('linkedin', {
    scope: ['openid', 'profile', 'email']
}));
router.get('/linkedin/callback', (req: Request, res: Response, next: NextFunction) => {
    configpassport.authenticate('linkedin', (err: any, user: any, info: any) => {
        if (err) {
            console.error('Passport error:', err);
            return next(err);
        }
        if (!user) {
            console.error('Authentication failed:', info);
            return res.redirect('/auth/failure'); // Or send a detailed error response
        }
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return next(loginErr);
            }
            return res.redirect(process.env.FRONTEND_URL + '/profile');
        });
    })(req, res, next);
});


// Facebook OAuth
router.get('/facebook', configpassport.authenticate('facebook'));

router.get('/facebook/callback',
    (req: Request, res: Response, next: NextFunction) => {
        configpassport.authenticate('facebook', (err: any, user: any, info: any) => {
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect('auth-mobileapp://auth/callback' + encodeURIComponent(err.message));
            }

            if (!user) {
                console.error('No user found:', info);
                return res.redirect('auth-mobileapp://auth/callback');
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error('Login error:', loginErr);
                    return res.redirect('auth-mobileapp://auth/callback');
                }

                // Add a success parameter to help frontend detect successful auth
                return res.redirect('auth-mobileapp://auth/callback');
            });
        })(req, res, next);
    }
);

// Current User Route
// router.get('/current-user', (req: Request, res: Response) => {
//     console.log('Current User:', req.user); 
//     res.json({ user: req.user || null });
// });

router.get('/current-user', (req: Request, res: Response) => {
    console.log('Current user request received');
    console.log('Session:', req.session);
    console.log('Cookies:', req.cookies);
    console.log('User object:', req.user);
    res.json({ user: req.user || null });
});

// Logout Route
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        try {
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                res.json({
                    success: true,
                    message: 'Successfully logged out'
                });
            });
        } catch (error) {
            next(error);
        }
    })().catch(next);
});

// Auth Failure Route
router.get('/failure', (req: Request, res: Response) => {
    res.status(401).json({ error: 'Authentication Failed' });
});

// Add this new route
router.get('/check-session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

export default router;