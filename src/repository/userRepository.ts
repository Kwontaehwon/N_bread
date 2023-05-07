import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';

import prisma from '../prisma';
import { logger } from '../config/winston';

const findUserById = async (id: number) => {
  const user = await prisma.users.findFirstOrThrow({ where: { id: id } });
  return user;
};

const isNicknameExist = async (nickName: string) => {
  const isDuplicated = await prisma.users.findFirst({
    where: { nick: nickName },
  });

  return !!isDuplicated;
};

const isEmailExist = async (email: string) => {
  const isDuplicated = await prisma.users.findFirst({ where: { email } });
  return !!isDuplicated;
};

const changeUserNick = async (id: number, nickName: string) => {
  try {
    await prisma.users.update({
      where: { id },
      data: {
        nick: nickName,
      },
    });
    const result = {
      userId: id,
      nick: nickName,
    };
    return result;
  } catch (error) {
    logger.error(error);
    throw errorGenerator({
      message: responseMessage.NICKNAME_CHANGE_FAIL,
      code: statusCode.BAD_REQUEST,
    });
  }
};

export { findUserById, isNicknameExist, isEmailExist, changeUserNick };
