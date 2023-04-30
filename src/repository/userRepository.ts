import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import prisma from '../prisma';
import { logger } from '../config/winston';

const findUserById = async (id: number) => {
  const user = await prisma.users.findFirst({ where: { id: id } });
  if (!user) {
    throw errorGenerator({
      message: responseMessage.USER_NOT_FOUND,
      code: statusCode.NOT_FOUND,
    });
  }
  return user;
};

const isNicknameExist = async (nickName: string) => {
  const isDuplicated = await prisma.users.findFirst({
    where: { nick: nickName },
  });
  if (isDuplicated) {
    throw errorGenerator({
      message: responseMessage.NICKNAME_DUPLICATED,
      code: statusCode.BAD_REQUEST,
    });
  }
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

export { findUserById, isNicknameExist, changeUserNick };
