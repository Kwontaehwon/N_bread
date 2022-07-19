const passport = require('passport');
const AppleStrategy = require('passport-apple').Strategy;
const jwt = require('jsonwebtoken');

module.exports = () => {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      callbackURL: 'https://chocobread.shop/auth/apple/callback',
      privateKeyString:process.env.APPLE_PRIVATE_KEY,
      passReqToCallback: true,
    }, async (req, accessToken, refreshToken, idToken, profile, cb) => {
      try {
        // console.log("apple test");
        // console.log(jwt.decode(idToken));
        process.nextTick(() => cb(null, decodedIdToken));
        } catch (error) {
        console.error(error);
        done(error);
      }
    }));
  };
  