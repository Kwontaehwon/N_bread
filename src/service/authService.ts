import { NextFunction, Request, Response } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { fail, success } from '../modules/util';
import { userRepository } from '../repository';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { jwtHandler } from '../modules';
import { logger } from '../config/winston';
import { users } from '@prisma/client';
import { Slack } from '../class/slack';
const logout = async (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      success(res, statusCode.OK, responseMessage.SUCCESS, {
        session: req.session,
      });
    });
  });
};

const localSignUp = async (req: Request, res: Response) => {
  const { email, nick, password } = req.body;
  try {
    const isEmailExist = await userRepository.isEmailExist(email);
    if (isEmailExist) {
      return fail(
        res,
        statusCode.BAD_REQUEST,
        responseMessage.EMAIL_DUPLICATED,
      );
    }
    const isNicknameExist = await userRepository.isNicknameExist(nick);
    if (isNicknameExist) {
      return fail(
        res,
        statusCode.BAD_REQUEST,
        responseMessage.NICKNAME_DUPLICATED,
      );
    }
    const hash = await bcrypt.hash(password, 12);
    await userRepository.createUser(email, nick, hash);

    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    console.log(error);
  }
};

const localLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'local',
    { session: false },
    (authError, user, info) => {
      if (!user) {
        logger.error(`로컬 로그인 실패2 : ${info.message}`);
        return fail(res, statusCode.FORBIDDEN, responseMessage.LOGIN_FAILED);
      }
      return req.login(user, async (loginError) => {
        if (loginError) {
          logger.error(loginError);
          return fail(
            res,
            statusCode.BAD_REQUEST,
            responseMessage.LOGIN_FAILED,
          );
        }
        const accessToken = jwtHandler.sign(user.id, 'local');
        const refreshToken = jwtHandler.createRefresh();

        await userRepository.saveRefresh(user.id, refreshToken);
        console.log(accessToken);
        res.cookie('accessToken', accessToken);
        return success(res, statusCode.OK, responseMessage.SUCCESS);
      });
    },
  )(req, res, next);
};

const appleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user: users = req.user;
    const accessToken = jwtHandler.sign(user.id, user.provider);
    res.cookie('accessToken', accessToken);
    if (user.nick == null) {
      Slack.sendMessage({
        color: Slack.Colors.success,
        title: '[회원가입]',
        text: `[apple] ${user.id}번 유저가 회원가입하였습니다.`,
      });
      return success(
        res,
        statusCode.REDIRECT,
        responseMessage.REDIRECT_TO_TERMS,
      );
    } else {
      return success(res, statusCode.OK, responseMessage.REDIRECT_TO_HOME);
    }
  } catch (error) {
    next(error);
  }
};

export { logout, localSignUp, localLogin, appleCallback };
