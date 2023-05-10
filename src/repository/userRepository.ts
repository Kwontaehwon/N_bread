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

const createUser = async (email: string, nick: string, password: string) => {
  try {
    const user = await prisma.users.create({
      data: {
        email,
        nick,
        password,
      },
    });
    const data = {
      id: user.id,
      email: user.email,
      nickName: user.nick,
    };
    return data;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.CREATE_USER_FAILED,
    });
  }
};

const findUserByEmail = async (email: string) => {
  try {
    const user = await prisma.users.findFirst({ where: { email } });
    return user;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

const saveRefresh = async (userId: number, refreshToken: string) => {
  try {
    const user = await prisma.users.update({
      where: { id: userId },
      data: { refreshToken },
    });
    return user;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

export {
  findUserById,
  isNicknameExist,
  isEmailExist,
  changeUserNick,
  createUser,
  findUserByEmail,
  saveRefresh,
};
