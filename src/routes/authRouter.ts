import express, { Router } from 'express';
import passport from 'passport'
import {
  isLoggedIn,
  isNotLoggedIn,
  verifyToken,
} from '../middlewares/middleware';
import { User } from '../database/models';
const jwt = require('jsonwebtoken');
import { logger } from '../config/winston';
import axios from 'axios';
import config from '../config';
import { Slack } from '../class/slack';
import { util } from '../modules/';
import { authService } from '../service';
const authRouter: Router = express.Router();

authRouter.post('/signup', isNotLoggedIn, authService.localSignUp);

authRouter.post('/login', isNotLoggedIn, authService.localLogin);

authRouter.get('/logout', isLoggedIn, authService.logout);

//카카오 SDK 로그인 api
//로그인 시 회원번호, email을 받아 db에 저장
authRouter.post('/kakaosdk/signup/', async (req, res, next) => {
  // #swagger.summary = '카카오 SDK 로그인 api'

  const { kakaoNumber, email } = req.body;
  console.log('kakaosdk signup');
  try {
    const userWithKakaoNumber = await User.findOne({
      where: { kakaoNumber: kakaoNumber },
    });
    console.log('cur usernumber is ' + kakaoNumber);
    if (!userWithKakaoNumber) {
      if (email === null) {
        const user = await User.create({
          kakaoNumber: kakaoNumber,
          provider: 'kakao',
        });
        logger.info(
          `[카카오SDK 회원가입] 처음 SDK를 이용해 로그인 한 유저입니다. DB에 회원번호 저장을 완료하였습니다.`,
        );
      } else {
        const user = await User.create({
          kakaoNumber: kakaoNumber,
          email: email,
          provider: 'kakao',
        });
        logger.info(
          `[카카오SDK 회원가입] 처음 SDK를 이용해 로그인 한 유저입니다. DB에 email, 회원번호 저장을 완료하였습니다.`,
        );
      }
      //token
      const url =
        'https://www.chocobread.shop/auth/kakaosdk/createToken/' + kakaoNumber;
      try {
        const getToken = await axios.get(url);
        console.log(getToken.data);
        console.log(getToken.data['result']['accessToken']);
        util.jsonResponse(
          res,
          300,
          '[카카오SDK 회원가입] jwt토큰 발급에 성공하였습니다. 약관 동의 화면으로 리다이렉트합니다.',
          true,
          { accessToken: getToken.data['result']['accessToken'] },
        );
        const user = await User.findOne({
          where: { kakaoNumber: kakaoNumber },
        });
        Slack.sendMessage({
          color: Slack.Colors.success,
          title: '[회원가입]',
          text: `[kakao] ${user.id}번 유저가 회원가입하였습니다.`,
        });
      } catch (error) {
        logger.error(error);
        return util.jsonResponse(
          res,
          500,
          '[카카오SDK 회원가입] POST /auth/kakao/signIn jwt토큰 발급 중 에러가 발생하였습니다.',
          false,
          null,
        );
      }
    } else {
      //닉네임이 null이 아님 -> 로그인(홈화면 이동[id provider nick으로 jwt토큰 발급 후 프론트 전달])
      //닉네임이 null -> 약관동의화면 이동
      const url =
        'https://www.chocobread.shop/auth/kakaosdk/createToken/' + kakaoNumber;
      try {
        const getToken = await axios.get(url);
        console.log(getToken.data);
        console.log(getToken.data['result']['accessToken']);

        if (userWithKakaoNumber.nick != null) {
          logger.info(
            '이전에 회원가입을 완료한 회원입니다. 홈 화면으로 리다이렉트합니다.',
          );
          return util.jsonResponse(
            res,
            200,
            '[카카오SDK 회원가입] jwt토큰 발급에 성공하였습니다. 홈 화면으로 리다이렉트합니다.',
            true,
            { accessToken: getToken.data['result']['accessToken'] },
          );
          // const url='http://localhost:5005/auth/kakaosdk/createToken/'+kakaoNumber;
        } else {
          console.log('찾은 유저의 nickname이 null입니다.');
          logger.info(
            '회원가입을 완료하지 않은 유저입니다. 약관동의화면으로 리다이렉트합니다.',
          );
          return util.jsonResponse(
            res,
            301,
            '[카카오SDK 회원가입] 회원가입을 완료하지 않은 유저입니다. 약관동의화면으로 리다이렉트합니다.',
            true,
            { accessToken: getToken.data['result']['accessToken'] },
          );
        }
      } catch (error) {
        logger.error(error);
        return util.jsonResponse(
          res,
          500,
          '[카카오SDK 회원가입] POST /auth/kakao/signIn jwt토큰 발급 중 에러가 발생하였습니다[기존sdk로그인유저].',
          false,
          null,
        );
      }
    }
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[카카오SDK 회원가입] POST /auth/kakao/signIn 서버 에러',
      false,
      null,
    );
  }
});

authRouter.get('/kakaosdk/createToken/:kakaoNumber', async (req, res, next) => {
  // #swagger.summary = '카카오 SDK로그인 시 토큰 생성 api'
  try {
    const user = await User.findOne({
      where: { kakaoNumber: req.params.kakaoNumber },
    });
    const payload = {
      id: user.id,
      provider: user.provider,
    };
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      issuer: 'chocoBread',
    });
    res.cookie('accessToken', accessToken);
    var token = {
      accessToken: accessToken,
    };
    console.log(accessToken);
    return util.jsonResponse(
      res,
      200,
      '[카카오 토큰 발급] 토큰 발급 성공',
      true,
      token,
    );
  } catch (err) {
    return util.jsonResponse(
      err,
      500,
      '[카카오 토큰 발급] GET /kakaosdk/createToken/:kakaoNumber 서버 에러',
      false,
      null,
    );
  }
});

authRouter.get(
  // #swagger.summary = '애플 로그인'
  '/apple',
  passport.authenticate('apple'),
);

authRouter.post(
  // #swagger.summary = '애플 로그인 CallBack'
  '/apple/callback',
  express.urlencoded({ extended: false }),
  passport.authenticate('apple'),
  authService.appleCallback,
);

authRouter.delete('/apple/signout', verifyToken, authService.appleSignOut);

// authRouter.delete('/kakaosdk/signout', verifyToken, async (req, res, next) => {
//   // #swagger.summary = '카카오 SDK 회원탈퇴'
//   try {
//     const user = await User.findOne({ where: { id: req.decoded.id } });
//     const userId = req.decoded.id;
//     console.log(user);
//     if (!user) {
//       logger.info(
//         '[카카오 SDK 회원탈퇴] id에 해당되는 유저를 찾을 수 없습니다.',
//       );
//       return util.jsonResponse(
//         res,
//         404,
//         '[카카오 SDK 회원탈퇴] id에 해당되는 유저를 찾을 수 없습니다.',
//         false,
//         null,
//       );
//     }
//     await user.destroy();
//     logger.info(`[카카오 회원 탈퇴] ${userId} 카카오 회원 탈퇴 완료`);
//     return util.jsonResponse(res, 200, '카카오 탈퇴완료', true, null);
//   } catch (error) {
//     logger.error('[카카오 회원 탈퇴] /auth/kakaosdk/signout 서버 에러' + error);
//     return util.jsonResponse(
//       res,
//       500,
//       '[카카오 회원 탈퇴] /auth/kakaosdk/signout 서버 에러',
//       false,
//       null,
//     );
//   }
// });

//https://appleid.apple.com/auth/authorize?response_type=code&client_id=shop.chocobread.service&scope=email%20name&response_mode=form_post&redirect_uri=https://chocobread.shop/auth/apple/callback

export { authRouter };
