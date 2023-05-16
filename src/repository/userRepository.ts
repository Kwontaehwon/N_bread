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
    await prisma.users.create({
      data: {
        email,
        nick,
        password,
      },
    });
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
    console.log(user);
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

const findGroupsByUserId = async (userId: number) => {
  try {
    const group = await prisma.groups.findMany({
      where: { userId },
      select: { id: true },
    });
    return group;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

const findDealsByDealIds = async (dealIds: Array<number>) => {
  try {
    await prisma.deals.findMany({
      where: {
        id: {
          in: dealIds,
        },
      },
      select: { id: true },
    });
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
  findGroupsByUserId,
  findDealsByDealIds,
};
