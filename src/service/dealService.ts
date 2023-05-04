import axios from 'axios';
import { success, fail } from '../modules/util';
import { userRepository, groupRepository, dealRepository } from '../repository';
import { dealParam } from '../dto/deal/dealParam';
import { logger } from '../config/winston';
import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import { dealDto } from '../dto/deal/dealDto';
import prisma from '../prisma';
const admin = require('firebase-admin');

const createDeal = async (req, res, next) => {
  try {
    const dealParam: dealParam = req.body; // currentMember 수정 필요.
    const userId = req.decoded.id;
    const deal = await dealRepository.dealTransction(dealParam, userId);
    const fcmTokenJson = await axios.get(
      `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${userId}`,
    );
    if (Object.keys(fcmTokenJson.data).length !== 0) {
      const fcmToken = fcmTokenJson.data.Item.fcmToken;
      const fcmTopicName = `dealFcmTopic` + deal.id;
      await admin.messaging().subscribeToTopic(fcmToken, fcmTopicName);
    }
    const dealDtos = new dealDto(
      deal.id,
      deal.link,
      deal.title,
      deal.content,
      deal.totalPrice,
      deal.personalPrice,
      deal.totalMember,
      deal.dealDate,
      deal.dealPlace,
      deal.loc1,
      deal.loc2,
      deal.loc3,
    );
    logger.info(`dealId : ${deal.id} 거래가 생성되었습니다.`);
    return success(res, statusCode.CREATED, responseMessage.SUCCESS, deal);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    console.log(req.params.dealId);
    const dealId: number = +req.params.dealId;
    const deal = await dealRepository.findDealById(dealId);
    if (deal.userId != req.decoded.id) {
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

export { createDeal, deleteDeal };
