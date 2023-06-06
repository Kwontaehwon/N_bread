import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import { dealParam } from '../dto/deal/dealParam';
import { Prisma, PrismaClient, users } from '@prisma/client';
import prisma from '../prisma';
import { userRepository, groupRepository, dealRepository } from '../repository';
import { DealUpdateParam } from '../dto/deal/DealUpdateParam';

const findDealById = async (id: number) => {
  try {
    return await prisma.deals.findFirstOrThrow({
      where: {
        id: id,
      },
    });
  } catch (error) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.DEAL_NOT_FOUND,
    });
  }
};

const createDealInTransaction = async (
  dealParam: dealParam,
  user: users,
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  return tx.deals.create({
    data: {
      link: dealParam.link,
      title: dealParam.title,
      content: dealParam.content,
      totalPrice: +dealParam.totalPrice,
      personalPrice: +dealParam.personalPrice,
      totalMember: +dealParam.totalMember,
      dealDate: new Date(dealParam.dealDate), // 날짜 변환
      dealPlace: dealParam.place,
      currentMember: 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯
      userId: user.id,
      loc1: user.curLocation1,
      loc2: user.curLocation2,
      loc3: user.curLocation3,
    },
  });
};

const dealTransction = async (dealParam: dealParam, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const user = await userRepository.findUserById(userId);
    const group = await groupRepository.createGroupInTransaction(
      1,
      user.id,
      tx,
    );
    const deal = await dealRepository.createDealInTransaction(
      dealParam,
      user,
      tx,
    );
    await groupRepository.updateDealIdInTransaction(group.id, deal.id, tx);
    return deal;
  });
};

const updateDeal = async (dealId: number, param: DealUpdateParam) => {
  return await prisma.deals.update({
    where: { id: dealId },
    data: {
      link: param.link,
      title: param.title,
      content: param.content,
      totalPrice: +param.totalPrice,
      personalPrice: +param.personalPrice,
      totalMember: +param.totalMember,
      dealDate: new Date(param.dealDate),
      dealPlace: param.place,
      currentMember: 1,
    },
  });
};

const getDealDetail = async (dealId: number) => {
  const deal = await prisma.deals.findFirstOrThrow({
    where: { id: dealId },
    orderBy: { createdAt: 'desc' },
    include: {
      dealImages: true,
      dealReports: true,
    },
  });
  return deal;
};

const readHomeAllDeal = async (range: string, region: string) => {
  let whereCondtion: Prisma.dealsWhereInput;
  if (range == 'loc1') {
    whereCondtion = {
      OR: [{ loc1: region }, { loc1: 'global' }],
    };
  }
  if (range == 'loc2') {
    whereCondtion = {
      OR: [{ loc2: region }, { loc2: 'global' }],
    };
  }
  if (range == 'loc3') {
    whereCondtion = {
      OR: [{ loc3: region }, { loc3: 'global' }],
    };
  }

  const allDeal = await prisma.deals.findMany({
    where: whereCondtion,
    orderBy: { createdAt: 'desc' },
    include: {
      dealImages: true,
      users: true,
    },
  });
  return allDeal;
};

export {
  findDealById,
  createDealInTransaction,
  dealTransction,
  updateDeal,
  getDealDetail,
  readHomeAllDeal,
};
