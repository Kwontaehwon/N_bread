const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../config/winston');


const router = express.Router();

function jsonResponse(res, code, message, isSuccess, result){
  res.status(code).json({
    code : code,
    message : message,
    isSuccess : isSuccess,
    result : result
  })
}



router.post('/signup', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    const exNick = await User.findOne({ where: { nick }});
    if (exUser) {
      return jsonResponse(res, 409, "이미 존재하는 이메일 입니다.", false, null)
    }
    if (exNick) {
      return jsonResponse(res, 409, "이미 존재하는 닉네임 입니다.", false, null)
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      nick,
      password: hash,
    });
    return jsonResponse(res, 200, "로컬 회원가입에 성공하였습니다.", true, user)
  } catch (error) {
    console.error(error);
    
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    console.log("USER : " + user);
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
      const payload = {
        id : user.id,
        nick : user.nick,
        provider : user.provider
      }
      const token = jwt.sign(
        payload, process.env.JWT_SECRET, {
        algorithm : 'HS256',
        expiresIn : '1m',
        issuer: 'chocoBread'
      });
      return res.json(token);
      //return jsonResponse(res,200,"로컬 로그인에 성공하였습니다.",true,req.user)
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout',isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  return jsonResponse(res, 200, '로그아웃에 성공하였습니다.', true, null);

});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/auth/error',
}), (req, res) => {
  logger.info(`User Id ${req.user.id} 님이 카카오 로그인에 성공하였습니다.`);
  return jsonResponse(res, 200, "카카오 로그인에 성공하였습니다.", true, req.user);
});

router.get('/naver', passport.authenticate('naver'));

router.get('/naver/callback', passport.authenticate('naver', {
  failureRedirect: '/auth/error',
  successRedirect: '/auth/success'
})), (req, res) => {
  // console.log(req.query.code);
  // console.log(req.query.state);
  logger.info(`User Id ${req.user.id} 님이 네이버 로그인에 성공하였습니다.`);
  return jsonResponse(res, 200, "네이버 로그인에 성공하였습니다.", true, req.user);
}

router.get('/apple', passport.authenticate('apple'));
router.post(
  '/apple/callback',
  express.urlencoded({ extended: false }),
  passport.authenticate('apple'),
  (req, res) => {
      logger.info(`User Id ${req.user.id} 님이 애플 로그인에 성공하였습니다.`);
      return jsonResponse(res, 200, "애플 로그인에 성공하였습니다.", true, req.user);
  }
);

router.get('/success', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  logger.info(`User ID : ${req.user.id} 네이버 로그인 성공.`);
  return jsonResponse(res, 200, "네이버 로그인에 성공하였습니다.", true, req.user);
})

router.get('/error', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  logger.error("auth/error 로그인 문제");
  return jsonResponse(res, 404, "정보가 잘못되었습니다. 다시 시도해 주세요. (다른 소셜간 이메일 중복)", false, req.user);
})

module.exports = router;
