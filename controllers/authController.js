const jwt = require('jsonwebtoken');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/UserModel');
const LastLogin = require('../models/LastLoginModel');

const authController = {
    setupGitHubStrategy: (passport, req, res) => {
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.CLIENTID,
                    clientSecret: process.env.CLIENTSECRET,
                    callbackURL: process.env.CALLBACKURL,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        let user = await User.findOne({ githubId: profile.id });

                        if (!user) {
                            user = new User({
                                githubId: profile.id,
                                username: profile.username || 'DefaultUsername',
                                name: profile.displayName || 'DefaultName',
                                profileUrl: profile.profileUrl || '/default-profile-url',
                                photos: profile.photos[0].value || '/assets/images/logo.png'
                            });

                            await user.save();
                        }
                        const lastLogin = new LastLogin({ expiresIn: new Date(Date.now() + 1 * 60 * 60 * 1000), token: accessToken, user: user.username });
                        await lastLogin.save();
                        return done(null, { user, token: accessToken });
                    } catch (err) {
                        console.error(err);
                        return done(err, null);
                    }

                }
            )
        );
    },
};
module.exports = authController;
