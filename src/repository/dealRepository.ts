import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import { dealParam } from '../dto/deal/dealParam';
import { users } from '@prisma/client';
import prisma from '../prisma';

const findDealById = async (id: number) => {
  return prisma.deals.findUnique({
    where: {
      id: id,
    },
  });
};

const createDeal = async (dealParam: dealParam, user: users) => {
  return prisma.deals.create({
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

export { findDealById, createDeal };
