const passport = require('passport');
const { passportLocal } = require('./localStrategy');
const { passportKakao } = require('./kakaoStrategy');
const { passportNaver } = require('./naverStrategy');
const { passportApple } = require('./appleStrategy');

const User = require('../../database/models/user');

const passportIndex = () => {
  passport.serializeUser((user, done) => {
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
