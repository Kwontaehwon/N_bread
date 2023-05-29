import { User } from '../database/models';
import axios from 'axios';
import { logger } from '../config/winston';
import { util } from '../modules';
import { fail, success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';
import { userRepository } from '../repository';
import { NextFunction, Request, Response, response } from 'express';
import { UserDto } from '../dto/user/userDto';
import { mypageDto } from '../dto/deal/mypageDto';
import { objectListToValueList } from '../modules/lib';
import {
  _getLocationByCoordinate,
  _setDealStatus,
  _setUserStatus,
} from '../modules/userModule';
import { findUserById } from '../repository/userRepository';
import { reportInfoDto } from '../dto/user/reportInfoDto';
import { userService } from '.';
// GET users/:userId
const getUser = async (req: Request, res: Response, next: NextFunction) => {
  // #swagger.summary = '유저 정보 반환'
  try {
    const { userId } = req.query;
    const user = await userRepository.findUserById(+userId);
    const result = {
      createdAt: user.createdAt,
      nick: user.nick,
      provider: user.provider,
      deletedAt: user.deletedAt,
      id: user.id,
      email: user.email,
      loc1: user.curLocation1,
      loc2: user.curLocation2,
      addr: user.curLocation3,
    };
    logger.info(
      `GET users/:userId | userId : ${req.params.userId} 의 유저 정보를 반환합니다.`,
    );
    return success(res, statusCode.OK, responseMessage.SUCCESS, result); // #swagger.responses[200]
  } catch (error) {
    logger.error(error);
    next(error);
    // #swagger.responses[500]
  }
};

// GET users/deals/:userId
const getMypageDeals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '마이페이지 거래내역 조회'
  try {
    const { userId } = req.query;

    /** 참가한 거래 내역 추출 */
    const participationObject = await userRepository.findGroupsByUserId(
      +userId,
    );
    const participatedIds = objectListToValueList(participationObject!);
    const participatedDealData = await userRepository.findDealsByDealIds(
      participatedIds,
    );

    /** 제안한 거래 내역 추출 */
    const suggesterDeal = await userRepository.findDealsByUserId(+userId);
    const suggesterId = objectListToValueList(suggesterDeal);

    let data: mypageDto[] = [];
    for (let i = 0; i < participatedDealData.length; i++) {
      data.push(participatedDealData[i] as mypageDto);
      /**거래 상태 설정: 거래완료, 모집실패, 모집중, 모집 완료*/
      _setDealStatus(data[i]);
      /**유저 상태 설정: 제안자, 참여자 */
      _setUserStatus(data[i], suggesterId);
    }
    return success(res, statusCode.OK, responseMessage.SUCCESS, data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

// GET users/location/:latitude/:longitude
const saveLocationByCoordinate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '네이버 GeoLocation으로 현 위치 저장'
  try {
    const { longitude, latitude } = req.params;
    const { userId } = req.query;
    await findUserById(+userId);
    const data = _getLocationByCoordinate(+longitude, +latitude);

    const loc1 = data['area1']['name'];
    const loc2 = data['area2']['name'];
    const loc3 = data['area3']['name'];

    await userRepository.saveUserLocation(+userId, loc1, loc2, loc3);

    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    //makeSignature();
    logger.error(error);
    next(error);
  }
};

// GET users/location
const getUserLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.deprecated = true
  try {
    const user = await userRepository.findUserById(+req.params.id);
    const data: UserDto = {
      id: +req.params.id,
      curLocation1: user!.curLocation1!,
      curLocation2: user!.curLocation2!,
      curLocation3: user!.curLocation3!,
    };
    logger.info(
      `users/location | userId : ${req.params.id}의 현재 지역 : ${data.curLocation3} 을 반환합니다.`,
    );
    return success(res, statusCode.OK, responseMessage.SUCCESS, data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

// PUT users/:userId
const changeUserNick = async (req, res, next) => {
  // #swagger.summary = '닉네임 변경'
  try {
    const userId = req.params.userId;
    const { nick } = req.body;
    await userRepository.findUserById(+userId);
    const isExist = await userRepository.isNicknameExist(nick);
    if (!isExist) {
      const result = await userRepository.changeUserNick(+userId, nick);
      logger.info(
        `PUT users/:userId | userId : ${result.userId} 님이 새로운 닉네임 ${result.nick} 으로 변경되었습니다.`,
      );
      return success(res, statusCode.OK, responseMessage.SUCCESS, result);
    }
    return fail(
      res,
      statusCode.BAD_REQUEST,
      responseMessage.NICKNAME_DUPLICATED,
    );
  } catch (error) {
    next(error);
  }
};

const checkUserNick = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '닉네임 중복 확인'
  try {
    const { userId, nick } = req.params;
    await findUserById(+userId);
    const isDuplicated = await userRepository.isNicknameExist(nick);

    if (isDuplicated) {
      return fail(
        res,
        statusCode.BAD_REQUEST,
        responseMessage.NICKNAME_DUPLICATED,
      );
    }

    return success(
      res,
      statusCode.OK,
      responseMessage.VALID_NICKNAME,
      isDuplicated,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const postReportUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '유저 신고'
  try {
    const { title, content } = req.body;
    const reportUserId = req.query.userId;
    const reportedUserId = req.params.userId;

    await findUserById(+reportUserId);
    await findUserById(+reportedUserId);

    if (+reportUserId === +reportedUserId) {
      return fail(
        res,
        statusCode.BAD_REQUEST,
        responseMessage.CANNOT_REPORT_MYSELF,
      );
    }

    const reportInfo: reportInfoDto = new reportInfoDto(
      title,
      content,
      +reportUserId,
      +reportedUserId,
    );
    await userRepository.saveReportInfo(reportInfo);
    logger.info(
      `${reportUserId} 님이 userId : ${reportedUserId}을 신고 하였습니다.`,
    );
    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    next(error);
  }
};

const deletelocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '동 삭제하기'
  try {
    const { userId } = req.query;
    const user = await userRepository.findUserById(+userId);
    const { dong } = req.params;
    await userRepository.deleteUserLocation(+userId, dong);
    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export {
  getUser,
  getMypageDeals,
  saveLocationByCoordinate,
  getUserLocation,
  changeUserNick,
  checkUserNick,
  postReportUser,
  deletelocation,
};
