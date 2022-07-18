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
      const exEmail = await User.findOne({
        where: { email: profile._json.kakao_account.email },
      })

      console.log("profile.id : " + profile._json.id);
      console.log("profile.email : " + profile._json.kakao_account.email);
      
      if (exUser) {
        done(null, exUser);
      }
      else if(exEmail) {
        console.log("다른 소셜로 이미 가입된 아이디입니다.");
        done(null, false, {message : '이미 가입된 이메일 입니다.'});
      }
      else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account.email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};
