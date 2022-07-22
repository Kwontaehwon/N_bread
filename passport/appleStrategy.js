const passport = require('passport');
const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
const jwt = require('jsonwebtoken');

module.exports = () => {
    passport.use(new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        key : fs.readFileSync(path.join(__dirname, 'AuthKey_689F483NJ3.p8')),
        callbackURL: "https://chocobread.shop/auth/apple/callback",
        scope: ['name', 'email']
      },
      (accessToken, refreshToken, profile, done) => {
          const {
              id,
              name: { firstName, lastName },
              email
          } = profile;

          // Create or update the local user here.
          // Note: name and email are only submitted on the first login!

          done(null, {
              id,
              email,
              name: { firstName, lastName }
          });
      }
  );
)};
  