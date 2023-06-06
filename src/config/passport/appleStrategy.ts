import passport from 'passport';
const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
import fs from 'fs';
import path from 'path';
import config from '../';
import { userRepository } from '../../repository';
import { users } from '@prisma/client';
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
          const exUser: users = await userRepository.findUserBySnsId(
            id,
            'apple',
          );
          const exEmail = await userRepository.isEmailExist(email);
          if (exUser && !exEmail) {
            await userRepository.updateRefreshToken(refreshToken, exUser.id);
            done(null, exUser);
          } else {
            const newUser: users = await userRepository.createSocialUser(
              email,
              id,
              refreshToken,
              'apple',
            );
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
