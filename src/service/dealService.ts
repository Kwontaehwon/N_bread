import axios from "axios";
import { util } from "../modules/index";
import {Deal, User, Group} from "../database/models"
import { userRepository, groupRepository, dealRepository } from "../repository";
import { dealParam } from "../dto/deal/dealParam";
import { logger } from "../config/winston";

const createDeal = async (req, res, next) => {
    try {
        const dealParam : dealParam = req.body; // currentMember 수정 필요.
        const userId = req.decoded.id;

        const user = await userRepository.findUserById(userId) || logger.info("INFONFON");
        if (!user) {
          logger.info(`userId : ${userId}에 매칭되는 유저가 없습니다.`);
          return util.jsonResponse(
            res,
            404,
            `userId : ${userId}에 매칭되는 유저가 없습니다.`,
            false,
            null,
          );
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
        logger.info(`dealId : ${deal.id} 거래가 생성되었습니다.`);
        return util.jsonResponse(res, 200, '거래가 생성되었습니다', true, deal);
      } catch (error) {
        logger.error(error);
        return util.jsonResponse(
          res,
          500,
          '[거래 생성] POST /deals/create 서버 에러',
          false,
          null,
        );
      }
}

export {
    createUserId
}