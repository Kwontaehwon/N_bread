import express, { Router } from 'express';
import passport from 'passport';
import {
  isLoggedIn,
  isNotLoggedIn,
  verifyToken,
} from '../middlewares/middleware';
import { authService } from '../service';
const authRouter: Router = express.Router();

authRouter.post('/signup', authService.localSignUp);

authRouter.post('/login', authService.localLogin);

authRouter.get('/logout', authService.logout);

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

authRouter.delete('/kakaosdk/signout', verifyToken, authService.kakaoSignOut);

export { authRouter };
