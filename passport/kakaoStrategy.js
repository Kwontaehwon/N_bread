const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const Op = require('sequelize');
const User = require('../models/user');

module.exports = () => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('kakao profile', profile);
    try {
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' }, 
      });

      console.log("profile.id : " + profile._json.id);
      console.log("profile.email : " + profile._json.kakao_account.email);
      
      if (exUser) {
        await exUser.update({isNewUser : false});
        done(null, exUser);
      }
      else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account.email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
          isNewUser: true
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};
