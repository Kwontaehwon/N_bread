const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const logger = require('../config/winston');
const axios = require('axios');
const qs = require('qs');
const { serveWithOptions } = require('swagger-ui-express');


const router = express.Router();

function jsonResponse(res, code, message, isSuccess, result){
  res.status(code).json({
    code : code,
    message : message,
    isSuccess : isSuccess,
    result : result
  })
}

function createClientSecret(){

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
  passport.authenticate('local', {session : false}, (authError, user, info) => {
    console.log("USER : " + user);
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      logger.error(`로컬 로그인 실패 : ${info.message}`);
      return jsonResponse(res, 400, `로컬 로그인 실패 ${info.message}`, info)
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
      const accessToken = jwt.sign(
        payload, process.env.JWT_SECRET, {
        algorithm : 'HS256',
        issuer: 'chocoBread',
      });
      res.cookie('accessToken', accessToken);
      return res.json("로그인 성공!");
      //return jsonResponse(res,200,"로컬 로그인에 성공하였습니다.",true,req.user)
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout',isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  return jsonResponse(res, 200, '로그아웃에 성공하였습니다.', true, null);

});

router.get('/kakao', passport.authenticate('kakao',  {session : false}));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/auth/error',
  successRedirect: '/auth/success'
}), (req, res) => {
  
});

router.get('/naver', passport.authenticate('naver', {session : false}));

router.get('/naver/callback', passport.authenticate('naver', {
  failureRedirect: '/auth/error',
  successRedirect: '/auth/success'
})), (req, res) => {
  const payload = {
    id : req.user.id,
    nick : req.user.nick,
    provider : req.user.provider
  }
  const accessToken = jwt.sign(
    payload, process.env.JWT_SECRET, {
    algorithm : 'HS256',
    issuer: 'chocoBread'
  });
  res.cookie('accessToken', accessToken);
  logger.info(`User Id ${req.user.id} 님이 네이버 로그인에 성공하였습니다.`);
  return jsonResponse(res, 200, "네이버 로그인에 성공하였습니다.", true, req.user);
}

router.get('/apple', passport.authenticate('apple'));
router.post(
  '/apple/callback',
  express.urlencoded({ extended: false }),
  passport.authenticate('apple'),
  (req, res) => {
    console.log("apple Signout : " + req.appleSignout);
    console.log("req.refresh : " + req.refresh);
    const payload = {
      id : req.user.id,
      nick : req.user.nick,
      provider : req.user.provider
    }
    const accessToken = jwt.sign(
      payload, process.env.JWT_SECRET, {
      algorithm : 'HS256',
      issuer: 'chocoBread'
    });
    res.cookie('accessToken', accessToken);
    logger.info(`User Id ${req.user.id} 님이 ${req.user.provider} 로그인에 성공하였습니다.`);
    logger.info(`jwt Token을 발행합니다.`);
    return jsonResponse(res, 200, `${req.user.provider} 로그인에 성공하였습니다.`, true, req.user);
  }
);

router.get('/success', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  const payload = {
    id : req.user.id,
    nick : req.user.nick,
    provider : req.user.provider
  }
  const accessToken = jwt.sign(
    payload, process.env.JWT_SECRET, {
    algorithm : 'HS256',
    issuer: 'chocoBread'
  });
  res.cookie('accessToken', accessToken);
  logger.info(`User Id ${req.user.id} 님이 ${req.user.provider} 로그인에 성공하였습니다.`);
  logger.info(`jwt Token을 발행합니다.`);
  return jsonResponse(res, 200, `${req.user.provider} 로그인에 성공하였습니다.`, true, req.user);
})

router.get('/error', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  logger.error("auth/error 로그인 문제");
  return jsonResponse(res, 404, "정보가 잘못되었습니다. 다시 시도해 주세요. (다른 소셜간 이메일 중복)", false, req.user);
})

router.get('/apple/signout', verifyToken, async (req, res, next) => {
  const nowSec = await Math.round(new Date().getTime() / 1000);
  const expirySec = 120000;
  const expSec = await nowSec + expirySec;
  const payload = {
    aud : "https://appleid.apple.com",
    iss : "5659G44R65",
    iat: nowSec,
    exp: expSec,
    sub : "shop.chocobread.service"
  }
  const signOptions = jwt.SignOptions = {
    algorithm: "ES256",
    header: {
        alg: "ES256",
        kid: "689F483NJ3",
        typ: "JWT"
    }
};
  const path = __dirname + '/../passport/AuthKey_689F483NJ3.p8'
  const privKey = fs.readFileSync(path);
  const appleClientSecret = jwt.sign(payload, privKey, signOptions);

  const user = await User.findOne({where : req.decoded.id });
  const data = {
    client_id : "shop.chocobread.service",
    client_secret : appleClientSecret,
    token : user.appleRefreshToken,
    token_type_hint : "refresh_token"
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  
  const qsData = qs.stringify(data);
  console.log(qsData);
  axios.post('https://appleid.apple.com/auth/revoke', qsData, {headers: headers})
  .then((response) => jsonResponse(res, 200, "탈퇴완료", true, null))
  .catch((error) => {
    logger.error(error);
    console.log(error);
    jsonResponse(res, 400, `apple signout error :   ${error}`, false, null);
  })
})

//https://appleid.apple.com/auth/authorize?response_type=code&client_id=shop.chocobread.service&scope=email%20name&response_mode=form_post&redirect_uri=https://chocobread.shop/auth/apple/callback

module.exports = router;
