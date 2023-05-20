import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';

import prisma from '../prisma';
import { logger } from '../config/winston';
import { reportInfoDto } from '../dto/user/reportInfoDto';

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
      select: { dealId: true },
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
    const dealData = await prisma.deals.findMany({
      where: {
        id: {
          in: dealIds,
        },
      },
      include: {
        users: { select: { nick: true, curLocation3: true } },
        dealImages: { select: { id: true, dealImage: true } },
      },
    });
    return dealData;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

const findDealsByUserId = async (userId: number) => {
  try {
    const suggestedDealId = await prisma.deals.findMany({
      where: { userId },
      select: { id: true },
    });
    return suggestedDealId;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

const saveUserLocation = async (
  userId: number,
  curLocation1: string,
  curLocation2: string,
  curLocation3: string,
) => {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: { curLocation1, curLocation2, curLocation3 },
    });
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.SAVE_USER_LOCATION_FAILED,
    });
  }
};

const saveReportInfo = async (reportInfo: reportInfoDto) => {
  try {
    await prisma.userReports.create({ data: reportInfo });
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.SAVE_USER_REPORT_INFO_FAILED,
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
  findDealsByUserId,
  saveUserLocation,
  saveReportInfo,
};
