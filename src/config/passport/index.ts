import passport from 'passport';
import { passportLocal } from './localStrategy';
import { passportKakao } from './kakaoStrategy';
import { passportNaver } from './naverStrategy';
import { passportApple } from './appleStrategy';

import { User } from '../../database/models/user';

const passportIndex = () => {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne({
      where: { id },
    })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

  passportLocal();
  passportKakao();
  passportNaver();
  passportApple();
};
export { passportIndex };
