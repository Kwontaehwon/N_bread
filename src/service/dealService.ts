import axios from 'axios';
import { util } from '../modules/index';
import { Deal, User, Group } from '../database/models';
import { userRepository, groupRepository, dealRepository } from '../repository';
import { dealParam } from '../dto/deal/dealParam';
import { logger } from '../config/winston';
import { errorGenerator } from '../modules/error/errorGenerator';
import { responseMessage } from '../modules/constants';
import { dealDto } from '../dto/deal/dealDto';

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
    await group.update({ dealId: deal.id }); // 업데이트
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

export { createDeal };
