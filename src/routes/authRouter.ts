import express, { Router } from 'express';
import passport from 'passport';
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

/** 카카오 SDK 로그인 api */
authRouter.post('/kakaosdk/signup/', authService.kakaoSignUp);

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
