import { Request, Response } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { fail, success } from '../modules/util';
import { userRepository } from '../repository';
import bcrypt from 'bcrypt';
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
  const isEmailExist = await userRepository.isEmailExist(email);
  if (isEmailExist) {
    fail(res, statusCode.BAD_REQUEST, responseMessage.EMAIL_DUPLICATED);
  }
  const isNicknameExist = await userRepository.isNicknameExist(nick);
  if (isNicknameExist) {
    fail(res, statusCode.BAD_REQUEST, responseMessage.NICKNAME_DUPLICATED);
  }

  const hash = await bcrypt.hash(password, 12);
  await userRepository.createUser(email, nick, hash);

  success(res, statusCode.OK, responseMessage.SUCCESS);
};

export { logout, localSignUp };
