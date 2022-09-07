const fetch = require('node-fetch');

const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const logger = require('../config/winston');
const { response } = require('express');
const axios = require('axios');
const qs = require('qs');

const { serveWithOptions } = require('swagger-ui-express');
const { urlencoded } = require('body-parser');
const { session } = require('passport');

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
  // #swagger.summary = '로컬 회원가입'
  try {
    const { email, nick, password } = req.body;
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
    const curUser = await User.findOne({ where: { email } });
    console.log(curUser.id);
    // var url = `http://localhost:${process.env.PORT}/users/location/`;
    // axios.post(url).then(async (Response)=>{
    //   console.log(Response.data);
    // }).catch((err)=>console.log(err));
    return jsonResponse(res, 200, "로컬 회원가입에 성공하였습니다.", true, user)
  } catch (error) {
    console.error(error);
    jsonResponse(res, 500, "[로컬 회원가입] POST /users/signup", false); 
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  // #swagger.summary = '로컬 로그인'
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

router.get('/logout', verifyToken, (req, res) => {
  // #swagger.summary = '로컬 로그아웃'
  req.logout();
  req.session.destroy();
  return jsonResponse(res, 200, '로그아웃에 성공하였습니다.', true, null);

});

router.get(
  // #swagger.summary = '카카오 로그인'
  '/kakao',
  passport.authenticate('kakao',  {session : false}));

router.get('/kakao/callback', passport.authenticate('kakao', {
  // #swagger.summary = '카카오 로그인 CallBack'
  failureRedirect: '/auth/error',
  successRedirect: '/auth/success'
}), (req, res) => {
  
});

router.get(
  // #swagger.summary = '네이버 로그인'
  '/naver',
  passport.authenticate('naver', {session : false}));

router.get('/naver/callback', passport.authenticate('naver', {
  // #swagger.summary = '네이버 로그인 CallBack'
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

router.get(
  // #swagger.summary = '애플 로그인'
  '/apple',
  passport.authenticate('apple'));

router.post(
  // #swagger.summary = '애플 로그인 CallBack'
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
    return res.status(200).send();
  }
);

router.get('/success', isLoggedIn, async (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  // #swagger.summary = '로그인 성공시 토큰 반환'
  console.log(req.exUser);
  const user = await User.findOne({where: { id : req.user.id}});
  req.logout();
  req.session.destroy();
  const payload = {
    id : user.id,
    nick : user.nick,
    provider : user.provider
  }
  const accessToken = jwt.sign(
    payload, process.env.JWT_SECRET, {
    algorithm : 'HS256',
    issuer: 'chocoBread'
  });
  res.cookie('accessToken', accessToken);
  logger.info(`User Id ${user.id} 님이 ${user.provider} 로그인에 성공하였습니다.`);
  logger.info(`jwt Token을 발행합니다.`);
  return res.status(200).send();
})

router.get('/error', (req, res, next) => { // 다른 소셜간 이메일 중복문제 -> 일반 로그인 추가되면 구분 위해 변경해야됨
  // #swagger.summary = '로그인 Error'
  logger.error("auth/error 로그인 문제");
  return jsonResponse(res, 500, "정보가 잘못되었습니다. 다시 시도해 주세요. (다른 소셜간 이메일 중복)", false, req.user);
})

router.get('/kakao/signout', verifyToken, async (req, res, next) => {
  // #swagger.summary = '카카오 회원탈퇴'
  try{
    const user = await User.findOne({where : {id : req.decoded.id} });
    const body = {
      target_id_type : "user_id",
      target_id : user.snsId
    }
    const qsBody = qs.stringify(body);
    const headers = {
      'Authorization': process.env.KAKAO_ADMIN_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    axios.post( `https://kapi.kakao.com/v1/user/unlink?target_id_type=user_id&target_id=${user.snsId}`, qsBody, {headers : headers})
    .then((response) => {
      console.log(response);
     user.destroy()
      .then(() => {
        return jsonResponse(res, 200, "카카오 탈퇴완료", true, null);
      })
    })
    .catch((error) => {
      logger.error(error);
      console.log(error);
      return jsonResponse(res, 400, `Kakao signout error :  ${error}`, false, null);
    })
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
})


router.get('/naver/signout', async (req, res, next) => {
  // #swagger.summary = '네이버 회원탈퇴'
  try{
    console.log(req.query);
    const body = {
      client_id : process.env.NAVER_CLIENT_ID,
      client_secret : process.env.NAVER_CLIENT_SECRET,
      grant_type : "authorization_code",
      code : req.query.code,
      state : process.env.CSRF_TOKEN,
    }
    const response = await axios.get(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${body.client_id}&client_secret=${body.client_secret}&code=${body.code}&state=${body.state}`)
    const accessToken = response.data.access_token;
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    }
    const profileResponse = await axios.get(`https://openapi.naver.com/v1/nid/me`, {headers : headers});
    console.log(profileResponse.data.response.id);
    const user = await User.findOne({where : {snsId : profileResponse.data.response.id}})
    if(user === null){
      logger.error("가입되어 있지 않은 naver 사용자에 대한 탈퇴를 진행할 수 없습니다.");
      return jsonResponse(res, 400, "가입되어 있지 않은 naver 사용자에 대한 탈퇴를 진행할 수 없습니다.", false, null);
    }
    const deleteResponse = await axios.get(`https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${body.client_id}&client_secret=${body.client_secret}&access_token=${accessToken}&service_provider=NAVER`)
    console.log(deleteResponse);
    await user.destroy()
    return jsonResponse(res, 200, "Naver 회원탈퇴가 완료되었습니다.", true, null);
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
});

router.get('/naver/reauth', async (req, res, next) => {
  // #swagger.summary = '네이버 회원탈퇴 전 재로그인'
  try{
    const body = {
      response_type : `code`,
      client_id : process.env.NAVER_CLIENT_ID,
      redirect_uri : encodeURI('https://chocobread.shop/auth/naver/signout'),
      state : process.env.CSRF_TOKEN,
      auth_type : "reauthenticate"
    }
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    res.redirect(`https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${body.client_id}&state=${body.state}&redirect_uri=${body.redirect_uri}&auth_type=reauthenticate`)
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
})

router.get('/apple/signout', verifyToken, async (req, res, next) => {
  // #swagger.summary = '애플 회원탈퇴'
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

  const user = await User.findOne({where : {Id :  req.decoded.id}});
  const data = {
    client_id : "shop.chocobread.service",
    client_secret : appleClientSecret,
    token : user.refreshToken,
    token_type_hint : "refresh_token"
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  
  const qsData = qs.stringify(data);
  console.log(qsData);
  axios.post('https://appleid.apple.com/auth/revoke', qsData, {headers: headers})
  .then((response) => {
    user.destroy()
    .then(() => {
      return jsonResponse(res, 200, "애플 탈퇴완료", true, null);
    })
  })
  .catch((error) => {
    logger.error(error);
    console.log(error);
    return jsonResponse(res, 400, `apple signout error :   ${error}`, false, null);
  })
})

router.get('/kakao/logout',async(req,res,next)=>{
  // #swagger.summary = '카카오 로그아웃'
  try {
    return jsonResponse(res, 200, '카카오 로그아웃 성공', true, null);
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
})

//https://appleid.apple.com/auth/authorize?response_type=code&client_id=shop.chocobread.service&scope=email%20name&response_mode=form_post&redirect_uri=https://chocobread.shop/auth/apple/callback

module.exports = router;
