const { User } = require('../database/models');
const { errorGenerator } = require('../modules/error/errorGenerator');
const { responseMessage, statusCode } = require('../modules/constants');
import prisma from '../prisma';

const findUserById = async (id: number) => {
  return prisma.users.findUnique({
    where: {
      id: id,
    },
  });
};

const putUserNick = async (id: number, nickName: string) => {
  const user = await User.findOne({ where: { Id: id } });
  console.log(id, nickName, 'this is repository');
  if (!user) {
    throw errorGenerator({
      message: responseMessage.USER_NOT_FOUND,
      statusCode: statusCode.NOT_FOUND,
    });
  }
  const isDuplicated = await User.findOne({ where: { nick: nickName } });
  if (isDuplicated) {
    throw errorGenerator({
      message: responseMessage.NICKNAME_DUPLICATED,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  await user.update({
    nick: nickName,
  });
  const result = {
    userId: user.id,
    nick: user.nickName,
  };
  return result;
};

export { findUserById, putUserNick };
