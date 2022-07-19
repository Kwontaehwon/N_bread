const passport = require('passport');
const AppleStrategy = require('passport-apple').Strategy;
const jwt = require('jsonwebtoken');

module.exports = () => {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      callbackURL: '/auth/apple/callback',
      privateKeyString:process.env.APPLE_PRIVATE_KEY,
      passReqToCallback: true,
    }, async (req, accessToken, refreshToken, idToken, profile, cb) => {
      try {
        console.log(idToken);
        console.log(jwt.decode(idToken));
      } catch (error) {
        console.error(error);
        done(error);
      }
    }));
  };
  