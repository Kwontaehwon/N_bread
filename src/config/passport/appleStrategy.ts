const passport = require('passport');
const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../../database/models/user');
import config from '../';
const passportApple = () => {
  passport.use(
    'apple',
    new AppleStrategy(
      {
        clientID: config.appleClientId,
        teamID: config.appleTeamId,
        keyID: config.appleKeyId,
        key: fs.readFileSync(
          path.join(__dirname, '../../../AuthKey_689F483NJ3.p8'),
        ),
        callbackURL: 'https://chocobread.shop/auth/apple/callback',
        scope: ['name', 'email'],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const { id, email } = profile;
          // Create or update the local user here.
          // Note: name and email are only submitted on the first login!
          const exUser = await User.findOne({
            where: { snsId: id, provider: 'apple' },
          });
          const exEmail = await User.findOne({
            where: { email: email },
          });

          if (exUser) {
            exUser.update({
              refreshToken: refreshToken,
              isNewUser: false,
            });
            done(null, exUser);
          } else {
            const newUser = await User.create({
              email: email,
              snsId: id,
              provider: 'apple',
              refreshToken: refreshToken,
              isNewUser: true,
            });
            done(null, newUser);
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      },
    ),
  );
};
export { passportApple };
