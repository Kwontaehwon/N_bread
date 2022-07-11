const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');


const router = express.Router();



router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    const exNick = await User.findOne({ where: { nick }});
    if (exUser) {
      return res.status(501).json({
        code: 501,
        message: '이미 존재하는 이메일 입니다.',
      });
    }
    if (exNick) {
      return res.status(501).json({
        code: 501,
        message: '이미 존재하는 닉네임 입니다.',
      });
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.status(200).json({
      code: 200,
      message: '로컬 회원가입에 성공하였습니다.',
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.status(200).json({
        code: 200,
        message: '로컬 로그인에 성공하였습니다.',
      });
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  return res.status(200).json({
    code: 200,
    message: '로그아웃에 성공하였습니다.',
  });
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  return res.status(200).json({
    code: 200,
    message: '카카오 로그인에 성공하였습니다.',
  });
});

router.get('/naver', passport.authenticate('naver'));

router.get('/naver/callback', passport.authenticate('naver', {
  failureRedirect: '/auth/error',
  successRedirect: '/',
})), (req, res) => {
  res.redirect('/');
}

router.get('/error', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  return res.status(404).json({
    code: 404,
    message: '정보가 잘못되었습니다. 다시 시도해 주세요. (다른 소셜간 이메일 중복)',
  });
})

module.exports = router;