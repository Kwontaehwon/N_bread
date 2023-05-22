import axios from 'axios';
import { success, fail } from '../modules/util';
import { userRepository, groupRepository, dealRepository } from '../repository';
import { dealParam } from '../dto/deal/dealParam';
import { logger } from '../config/winston';
import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import { DealDto } from '../dto/deal/dealDto';
import prisma from '../prisma';
import { GroupDto } from '../dto/groupDto';
import fcmMessage from '../modules/constants/fcmMessage';
import { fcmHandler } from '../modules';
import { DealUpdateParam } from '../dto/deal/DealUpdateParam';
const admin = require('firebase-admin');

const createDeal = async (req, res, next) => {
  try {
    const dealParam: dealParam = req.body; // currentMember 수정 필요.
    const userId = req.query.userId;
    const deal = await dealRepository.dealTransction(dealParam, userId);
    await fcmHandler.dealSubscribe(userId, deal.id);
    const dealDtos = new DealDto(deal);
    logger.info(`dealId : ${deal.id} 거래가 생성되었습니다.`);
    return success(res, statusCode.CREATED, responseMessage.SUCCESS, deal);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    const dealId: number = +req.params.dealId;
    const deal = await dealRepository.findDealById(dealId);
    if (deal.userId != req.query.userId) {
      return fail(
        res,
        statusCode.UNAUTHORIZED,
        responseMessage.DEAL_DELETE_NOT_AUTHORIZED,
      );
    }
    const groups = await prisma.groups.findMany({ where: { dealId: deal.id } });
    if (groups.length > 1) {
      return fail(
        res,
        statusCode.UNAUTHORIZED,
        responseMessage.DEAL_ALREADY_PARTICIPATED,
      );
    }
    const deletedDeal = await prisma.deals.delete({
      where: { id: dealId },
    });
    const comment = await prisma.comments.deleteMany({
      where: { dealId: dealId },
    });
    const reply = await prisma.replies.deleteMany({
      where: { dealId: dealId },
    });
    return success(res, statusCode.OK, responseMessage.SUCCESS, null);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const dealId: number = +req.params.dealId;
    const dealUpdateParam: DealUpdateParam = req.body;
    const deal = await dealRepository.findDealById(dealId);

    if (deal.userId != req.query.userId) {
      logger.info(
        `userId : ${req.query.userId}는 거래를 수정할 권한이 없습니다.`,
      );
      return fail(
        res,
        statusCode.FORBIDDEN,
        responseMessage.DEAL_DELETE_NOT_AUTHORIZED,
      );
    }

    const groups = await prisma.groups.findMany({
      where: { dealId: dealId },
    });
    if (groups.length > 1) {
      logger.info(
        `참여자가 ${groups.length - 1}명 있으므로 거래를 수정 할 수 없습니다.`,
      );
      return fail(
        res,
        statusCode.BAD_REQUEST,
        responseMessage.DEAL_ALREADY_PARTICIPATED,
      );
    }

    await dealRepository.updateDeal(dealId, dealUpdateParam);
    logger.info(`${dealId} 의 거래를 수정하였습니다.`);

    const dealDto: DealDto = new DealDto(deal);
    success(res, statusCode.OK, responseMessage.SUCCESS, dealDto);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const joinDeal = async (req, res, next) => {
  const userId = req.params.userId;
  const dealId = req.params.dealId;

  const user = await userRepository.findUserById(userId);
  const deal = await dealRepository.findDealById(dealId);
  const isJoin = await groupRepository.findAlreadyJoin(userId, dealId);

  if (isJoin) {
    return fail(res, statusCode.FORBIDDEN, responseMessage.DEAL_ALREADY_JOINED);
  }
  if (deal.dealDate.getDate() < Date.now()) {
    return fail(res, statusCode.FORBIDDEN, responseMessage.DEAL_DATE_EXPIRED);
  }
  const stock = deal.totalMember - deal.currentMember;
  if (stock <= 0) {
    return fail(
      res,
      statusCode.BAD_REQUEST,
      responseMessage.DEAL_REQUEST_OUT_OF_STOCK,
    );
  }

  const group = await groupRepository.createGroup(userId, dealId);

  await prisma.deals.update({
    data: { currentMember: deal.currentMember + 1 },
    where: { id: deal.id },
  });

  // 그룹에 있는 모든 유저들에게
  const fcmNotification: FcmNotification = {
    title: fcmMessage.NEW_PARTICIPANT,
    body: `${user.nick}님이 N빵에 참여하여 인원이 ${deal.currentMember} / ${deal.totalMember} 가 되었습니다!`,
  };

  const fcmData: FcmData = {
    type: 'deal',
    dealId: dealId,
  };

  const fcmTopic = 'dealFcmTopic' + deal.id;

  const topicMessage = new TopicMessage(fcmNotification, fcmData, fcmTopic);

  await fcmHandler.sendToSub(topicMessage);
  await fcmHandler.dealSubscribe(userId, dealId);

  const groupDto = new GroupDto(group);
  const dealDto = new DealDto(deal);

  const returnJson = { groupDto, dealDto };
  return success(res, statusCode.OK, responseMessage.SUCCESS, returnJson);
};

export { createDeal, deleteDeal, updateDeal, joinDeal };
