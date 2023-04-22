import axios from 'axios';
import { util } from '../modules/index';
import { userRepository, groupRepository, dealRepository } from '../repository';
import { dealParam } from '../dto/deal/dealParam';
import { logger } from '../config/winston';
import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage } from '../modules/constants';
import { dealDto } from '../dto/deal/dealDto';
import prisma from '../prisma';
const admin = require('firebase-admin');

const createDeal = async (req, res, next) => {
  try {
    const dealParam: dealParam = req.body; // currentMember 수정 필요.
    const userId = req.decoded.id;
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw errorGenerator({
        message: responseMessage.NOT_FOUND,
        code: 404,
      });
    }
    const group = await groupRepository.createGroup(1, userId);
    const deal = await dealRepository.createDeal(dealParam, user);
    await groupRepository.updateDealId(group.id, deal.id);
    const fcmTokenJson = await axios.get(
      `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${user.id}`,
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
    return util.jsonResponse(res, 200, '거래가 생성되었습니다', true, dealDtos);
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

    logger.info(dealId);

    if (!deal) {
      return util.jsonResponse(
        res,
        404,
        'dealId에 매칭되는 deal를 찾을 수 없습니다.',
        false,
        null,
      );
    }
    if (deal.userId != req.decoded.id) {
      return util.jsonResponse(
        res,
        403,
        '글의 작성자만 거래를 삭제할 수 있습니다.',
        false,
        null,
      );
    }
    const groups = await prisma.groups.findMany({ where: { dealId: deal.id } });
    if (groups.length > 1) {
      return util.jsonResponse(
        res,
        400,
        '참여자가 있으므로 거래를 삭제할 수 없습니다.',
        false,
        null,
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
    return util.jsonResponse(
      res,
      200,
      '정상적으로 거래를 삭제하였습니다.',
      true,
      null,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export { createDeal, deleteDeal };
