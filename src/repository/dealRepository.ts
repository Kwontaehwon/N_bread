import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import { dealParam } from '../dto/deal/dealParam';
import { PrismaClient, users } from '@prisma/client';
import prisma from '../prisma';
import { userRepository, groupRepository, dealRepository } from '../repository';

const findDealById = async (id: number) => {
  const deal = await prisma.deals.findUnique({
    where: {
      id: id,
    },
  });
  if (!deal) {
    throw errorGenerator({
      message: responseMessage.DEAL_NOT_FOUND,
      code: statusCode.NOT_FOUND,
    });
  }
  return deal;
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

export { findDealById, createDealInTransaction, dealTransction };
