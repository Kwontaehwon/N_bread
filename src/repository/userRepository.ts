const { User } = require('../database/models');
import { errorGenerator } from '../modules/error/errorGenerator';
const { responseMessage, statusCode } = require('../modules/constants');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const findUserById = async (id: number) => {
  return prisma.users.findUnique({
    where: {
      id: id,
    },
  });
};

const changeUserNick = async (id: number, nickName: string) => {
  try {
    const user = await prisma.users.findFirst({ where: { id: id } });
    if (!user) {
      throw errorGenerator({
        message: responseMessage.USER_NOT_FOUND,
        code: statusCode.NOT_FOUND,
      });
    }
    const isDuplicated = await prisma.users.findFirst({
      where: { nick: nickName },
    });
    if (isDuplicated) {
      throw errorGenerator({
        message: responseMessage.NICKNAME_DUPLICATED,
        code: statusCode.BAD_REQUEST,
      });
    }
    const updateRes = await prisma.users.update({
      where: { id },
      data: {
        nick: nickName,
      },
    });
    const result = {
      userId: updateRes.id,
      nick: updateRes.nick,
    };
    return result;
  } catch (error) {
    throw error;
  }
};

export { findUserById, changeUserNick };
