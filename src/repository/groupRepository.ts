import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import prisma from '../prisma';

const createGroup = async (amount: number, userId: number) => {
  return await prisma.groups.create({
    data: {
      amount: amount,
      userId: userId,
    },
  });
};

const updateDealId = async (id: number, dealId: number) => {
  return await prisma.groups.update({
    data: {
      dealId: dealId,
    },
    where: {
      id: id,
    },
  });
};

export { createGroup, updateDealId };
