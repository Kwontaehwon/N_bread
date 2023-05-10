import { NextFunction, Request, Response } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { fail, success } from '../modules/util';
import { userRepository } from '../repository';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { jwtHandler } from '../modules';
import { logger } from '../config/winston';
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
      if (authError || !user) {
        logger.error(`로컬 로그인 실패 : ${info.message}`);
        return fail(res, statusCode.NOT_FOUND, responseMessage.USER_NOT_FOUND);
      }
      if (!user) {
        logger.error(`로컬 로그인 실패 : ${info.message}`);
        return fail(res, statusCode.FORBIDDEN, responseMessage.WRONG_PASSWORD);
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
        const accessToken = jwtHandler.sign(user.id);
        const refreshToken = jwtHandler.createRefresh();

        await userRepository.saveRefresh(user.id, refreshToken);
        console.log(accessToken);
        res.cookie('accessToken', accessToken);
        return success(res, statusCode.OK, responseMessage.SUCCESS);
      });
    },
  )(req, res, next);
};

export { logout, localSignUp, localLogin };
