import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import prisma from '../prisma';
import { PrismaClient, PrismaPromise } from '@prisma/client';

const createGroupInTransaction = async (
  amount: number,
  userId: number,
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  return await tx.groups.create({
    data: {
      amount: amount,
      userId: userId,
    },
  });
};

const updateDealIdInTransaction = async (
  id: number,
  dealId: number,
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  return await tx.groups.update({
    data: {
      dealId: dealId,
    },
    where: {
      id: id,
    },
  });
};

const findAlreadyJoin = async (userId: number, dealId: number) => {
  return await prisma.groups.findFirst({
    where: { userId: userId, dealId: dealId },
  });
};

const createGroup = async (userId: number, dealId: number) => {
  return await prisma.groups.create({
    data: {
      amount: 1,
      userId: userId,
      dealId: dealId,
    },
  });
};

const findGroupByUserIdAndDealId = async (userId: number, dealId: number) => {
  return await prisma.groups.findFirst({
    where: {
      userId: userId,
      dealId: dealId,
    },
  });
};

export {
  createGroupInTransaction,
  createGroup,
  updateDealIdInTransaction,
  findAlreadyJoin,
  findGroupByUserIdAndDealId,
};
