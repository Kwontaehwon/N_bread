import { User, Group, Deal, DealImage, UserReport } from '../database/models';
import axios from 'axios';
import { logger } from '../config/winston';
import config from '../config';
import { util } from '../modules';
import { success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';
import { userRepository } from '../repository';
import { NextFunction, Request, Response } from 'express';
import { UserDto } from '../dto/userDto';
// GET users/:userId
const getUser = async (req, res, next) => {
  // #swagger.summary = '유저 정보 반환'
  try {
    const userId = req.params.userId;
    const user = await userRepository.findUserById(+userId);
    if (!user) {
      return util.jsonResponse(
        res,
        404,
        'userId에 해당되는 유저가 없습니다.',
        false,
        null,
      ); // #swagger.responses[404]
    }
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
    return util.jsonResponse(
      res,
      200,
      'userId의 정보를 반환합니다.',
      true,
      result,
    ); // #swagger.responses[200]
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[유저 정보 반환] GET users/:userId 서버 에러',
      false,
    ); // #swagger.responses[500]
  }
};

// GET users/deals/:userId
const getMypageDeals = async (req, res, next) => {
  // #swagger.summary = '마이페이지 거래내역 조회'
  try {
    const user = userRepository.findUserById(+req.decoded.id);
    const refDeal = await Group.findAll({ where: { userId: req.decoded.id } });
    console.log('refDeal : ' + refDeal);
    if (refDeal.length === 0) {
      console.log('refDeal is null');
      logger.info(
        `users/deals/:userId | userId : ${req.decoded.id}의 마이페이지에 [] 을 반환합니다.`,
      );
      return util.jsonResponse(res, 200, '마이페이지 글 리스트', true, []);
    } else {
      // const [tmpres, metadata] = await sequelize.sequelize.query(
      //   `select id from deals where id in (select dealId from nBread.groups where userId = ?) or deals.userId = ?`,
      //   {
      //     replacements: [user.id, user.id],
      //     type: sequelize.select,
      //   },
      // );

      var suggesterId = [];
      var memberId = [];

      const suggesterDeal = await Deal.findAll({
        where: { userId: user.id },
      });
      for (let i = 0; i < suggesterDeal.length; i++) {
        suggesterId.push(suggesterDeal[i]['id']);
      }
      //logger.debug()
      console.log('suggesterId : ', suggesterId);

      // for (let i = 0; i < tmpres.length; i++) {
      //   memberId.push(tmpres[i]['id']);
      // }
      console.log(memberId);
      const deal = await Deal.findAll({
        where: { id: memberId },
        include: [
          {
            model: DealImage,
            attributes: ['dealImage', 'id'],
          },
          {
            model: User,
            attributes: ['nick', 'curLocation3'],
            paranoid: false,
          },
        ],
      });
      //mystatus처리
      for (let i = 0; i < deal.length; i++) {
        var toSetStatus = deal[i];
        var dDate = new Date(toSetStatus['dealDate']);
        dDate.setHours(dDate.getHours() + 9);
        toSetStatus['dealDate'] = dDate;
        toSetStatus['mystatus'] = 'user';

        if (toSetStatus['dealDate'] < new Date(Date.now())) {
          if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
            toSetStatus['status'] = '거래완료';
          else toSetStatus['status'] = '모집실패';
        } else {
          if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
            toSetStatus['status'] = '모집완료';
          else toSetStatus['status'] = '모집중';
        }

        if (suggesterId.includes(deal[i]['id'])) {
          deal[i]['mystatus'] = '제안자';
        } else {
          deal[i]['mystatus'] = '참여자';
        }
      }
      logger.info(
        `users/deals/:userId | userId : ${req.params.userId}의 마이페이지에 글을 반환합니다.`,
      );
      return util.jsonResponse(res, 200, '전체 글 리스트', true, deal);
    }
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[마이페이지 거래내역] /users/deals/:userId 서버 에러',
      false,
    );
  }
};

// GET users/location/:userId/:latitude/:longitude
const getNaverGeoLocation = async (req, res) => {
  // #swagger.summary = '네이버 GeoLocation으로 현 위치 저장'
  try {
    const longitude = req.params.longitude;
    const latitude = req.params.latitude;
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return util.jsonResponse(
        res,
        404,
        'userId에 해당되는 유저가 없습니다.',
        false,
        null,
      );
    }

    const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${longitude},${latitude}&sourcecrs=epsg:4326&orders=legalcode&output=json`;

    axios
      .get(url, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': config.naverClientId,
          'X-NCP-APIGW-API-KEY': config.NaverClientSecret,
        },
      })
      .then(async (Response) => {
        if (Response.data['status']['code'] === 200) {
          util.jsonResponse(
            res,
            401,
            'Naver ClientKey, Naver ClientSecretKey가 필요합니다.',
            false,
            null,
          );
        } else if (Response.data['status']['code'] === 100) {
          util.jsonResponse(
            res,
            400,
            '좌표가 유효하지 않습니다. 올바른 좌표를 넣어주세요.',
            false,
            null,
          );
        } else {
          const tmpdata = Response.data;
          const data = tmpdata['results'][0]['region'];
          console.log(['area1']['name']);
          //console.log(data.geoLocation.r2);
          user.update({
            curLocation1: data['area1']['name'],
            curLocation2: data['area2']['name'],
            curLocation3: data['area3']['name'],
          });
          util.jsonResponse(
            res,
            200,
            `현재 위치 저장이 완료되었습니다. 현재 위치는 ${data['area1']['name']} ${data['area2']['name']} ${data['area3']['name']}입니다. `,
            true,
            {
              location1: data['area1']['name'],
              location2: data['area2']['name'],
              location3: data['area3']['name'],
            },
          );
        }
      })
      .catch((err) => {
        console.log('err : ' + err);
        logger.error(err);
        return util.jsonResponse(
          res,
          500,
          '[Naver GeoLocation] users/location/:userId/:latitude/:longitude 내부 서버 에러',
          false,
          err,
        );
      });
    //makeSignature();
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[Naver GeoLocation] users/location/:userId/:latitude/:longitude 서버 에러',
      false,
    );
  }
};

// GET users/location/:latitude/:longitude
const getLocationByNaverMapsApi = async (req, res) => {
  // #swagger.summary = '네이버 Reverse Geocoding으로 현 위치 획득'
  try {
    const longitude = req.params.longitude;
    const latitude = req.params.latitude;
    const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${longitude},${latitude}&sourcecrs=epsg:4326&orders=legalcode&output=json`;

    axios
      .get(url, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': config.naverClientId,
          'X-NCP-APIGW-API-KEY': config.NaverClientSecret,
        },
      })
      .then(async (Response) => {
        if (Response.data['status']['code'] === 200) {
          util.jsonResponse(
            res,
            401,
            'Naver ClientKey, Naver ClientSecretKey가 필요합니다.',
            false,
            null,
          );
        } else if (Response.data['status']['code'] === 100) {
          util.jsonResponse(
            res,
            400,
            '[getLocationByNaver] 좌표가 유효하지 않습니다. 올바른 좌표를 넣어주세요.',
            false,
            null,
          );
        } else {
          const tmpdata = Response.data;
          const data = tmpdata['results'][0]['region'];
          util.jsonResponse(
            res,
            200,
            `[getLocationByNaver]현재 위치는 ${data['area1']['name']} ${data['area2']['name']} ${data['area3']['name']}입니다. `,
            true,
            {
              location1: data['area1']['name'],
              location2: data['area2']['name'],
              location3: data['area3']['name'],
            },
          );
        }
      })
      .catch((err) => {
        console.log('err : ' + err);
        logger.error(err);
        return util.jsonResponse(
          res,
          500,
          '[getLocationByNaver] users/location/:latitude/:longitude 내부 서버 에러',
          false,
          err,
        );
      });
    //makeSignature();
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[getLocationByNaver] users/location/:latitude/:longitude 서버 에러',
      false,
    );
  }
};
// POST users/location/:userId/:loc1/:loc2/:loc3
const setLocationByNaverMapsApi = async (req, res) => {
  // #swagger.summary = '네이버 Reverse Geocoding으로 현 위치 저장'
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return util.jsonResponse(
        res,
        404,
        '[setLocationByNaver] userId에 해당되는 유저가 없습니다.',
        false,
        null,
      );
    }
    user.update({
      curLocation1: req.params.loc1,
      curLocation2: req.params.loc2,
      curLocation3: req.params.loc3,
    });
    return util.jsonResponse(
      res,
      200,
      `[setLocationByNaver] 유저${user.id}의 위치가 ${req.params.loc1} ${req.params.loc2} ${req.params.loc3}으로 저장되었습니다.`,
      true,
      null,
    );
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[setLocationByNaver] users/location/:userId/:loc1/:loc2/:loc3 서버 에러',
      false,
    );
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
      curLocation1: user.curLocation1,
      curLocation2: user.curLocation2,
      curLocation3: user.curLocation3,
    };
    logger.info(
      `users/location | userId : ${req.params.id}의 현재 지역 : ${data.curLocation3} 을 반환합니다.`,
    );
    res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.GET_LOCATION_SUCCESS, data));
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

// PUT users/:userId
const putUserNick = async (req, res, next) => {
  // #swagger.summary = '닉네임 변경'
  try {
    const userId = req.params.userId;
    const { nick } = req.body;
    const result = await userRepository.putUserNick(userId, nick);
    logger.info(
      `PUT users/:userId | userId : ${result.userId} 님이 새로운 닉네임 ${result.nick} 으로 변경되었습니다.`,
    );
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.NICKNAME_CHANGE_SUCESS, result),
      );
  } catch (error) {
    next(error);
  }
};

const checkUserNick = async (req, res, next) => {
  // #swagger.summary = '닉네임 중복 확인'
  try {
    const nick = req.params.nick;
    const user = await User.findOne({ where: { Id: req.params.userId } });
    if (!user) {
      logger.info(`userId : ${req.params.userId}에 해당되는 유저가 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `userId : ${req.params.userId}에 해당되는 유저가 없습니다.`,
        false,
        null,
      );
    }
    const isDuplicated = await User.findOne({ where: { nick: nick } });
    if (isDuplicated) {
      logger.info(`중복된 닉네임 (${nick})이 이미 존재합니다.`);
      return util.jsonResponse(
        res,
        409,
        `중복된 닉네임 (${nick})이 이미 존재합니다.`,
        false,
        null,
      );
    } else {
      return util.jsonResponse(
        res,
        200,
        `(${nick})은 사용가능한 닉네임입니다.`,
        true,
        null,
      );
    }
  } catch (error) {
    console.log(error);
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      `[닉네임 중복 체크] /check/:userId/:nick 서버 에러`,
      false,
    );
  }
};

const postReportUser = async (req, res, next) => {
  // #swagger.summary = '유저 신고'
  try {
    const { title, content } = req.body;
    if (title === undefined || content === undefined) {
      logger.info(`Body에 빠진 정보가 있습니다.`);
      return util.jsonResponse(
        res,
        400,
        `req.body에 빠진 정보가 있습니다`,
        false,
        null,
      );
    }
    if (req.params.userId == ':userId') {
      return util.jsonResponse(
        res,
        404,
        `parameter :userId가 필요합니다.`,
        false,
        null,
      );
    }
    const reporter = await User.findOne({ where: { Id: req.decoded.id } });
    const reportedUser = await User.findOne({
      where: { Id: req.params.userId },
    });

    if (!reporter) {
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`,
        false,
        null,
      );
    }
    if (!reportedUser) {
      logger.info(
        `userId : ${req.params.userId} 에 해당되는 유저가 없어 신고할 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        `userId : ${req.params.userId} 에 유저가 없어 신고할 수 없습니다.`,
        false,
        null,
      );
    }
    if (reporter.id === reportedUser.id) {
      logger.info(
        `userId : ${req.decoded.id} 자기 자신을 신고 할 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        403,
        `userId : ${req.decoded.id} 자기 자신을 신고 할 수 없습니다.`,
        false,
        null,
      );
    }
    const userReport = await UserReport.create({
      title: title,
      content: content,
      reportedUserId: req.params.userId,
      reporterId: req.decoded.id,
    });
    logger.info(
      `${req.params.userId} 님이 userId : ${req.params.userId}을 신고 하였습니다.`,
    );
    return util.jsonResponse(
      res,
      200,
      `${req.params.userId} 님이 userId : ${req.params.userId}을 신고 하였습니다.`,
      true,
      userReport,
    );
  } catch (error) {
    console.error(error);
    return util.jsonResponse(
      res,
      500,
      '[유저신고] /report/:userId 서버 에러',
      false,
      null,
    );
  }
};

const isSetNickname = async (req, res, next) => {
  // #swagger.summary = '회원가입 여부 반환'
  try {
    const user = await User.findOne({
      where: { Id: req.params.userId },
      paranoid: false,
    });
    if (!user) {
      return util.jsonResponse(
        res,
        404,
        'userId에 해당되는 유저가 없습니다.',
        false,
        null,
      ); // #swagger.responses[404]
    } else if (user.deletedAt != null) {
      logger.info(
        `GET users/check/:userId | userId : ${req.params.userId} 는 탈퇴한 회원입니다.`,
      );
      return util.jsonResponse(res, 404, '탈퇴한 유저입니다.', false, null); // #swagger.responses[404]
    } else {
      const result = {
        nick: user.nick,
        provider: user.provider,
        deletedAt: user.deletedAt,
        setNickname: false,
      };
      if (user.nick != null) {
        logger.info(
          `GET users/check/:userId | userId : ${req.params.userId} 는 회원가입을 완료한 회원입니다.`,
        );
        result.setNickname = true;
        return util.jsonResponse(
          res,
          200,
          `[회원가입 완료 여부]${req.params.userId} 는 회원가입을 완료한 회원입니다. 홈 화면으로 리다이렉트합니다.`,
          true,
          result,
        ); // #swagger.responses[200]
      } else {
        logger.info(
          `GET users/check/:userId | userId : ${req.params.userId} 는 회원가입을 완료하지 않은 회원입니다.`,
        );
        return util.jsonResponse(
          res,
          300,
          `[회원가입 완료 여부]${req.params.userId} 는 회원가입을 완료하지 않은 회원입니다. 약관동의 화면으로 리다이렉트합니다.`,
          true,
          result,
        ); // #swagger.responses[200]
      }
    }
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[회원가입 완료 여부] GET users/check/:userId 서버 에러',
      false,
      null,
    ); // #swagger.responses[500]
  }
};

const deletelocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // #swagger.summary = '동 삭제하기'
  try {
    var token = req.headers.authorization;
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      logger.info(
        `DELETE users/location/:dong | userId : ${req.params.id}는 회원이 아닙니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        '[동 삭제 api] userId에 해당되는 유저가 없습니다.',
        false,
        null,
      ); // #swagger.responses[404]
    }
    const dong = req.params.dong;
    if (user.curLocationC === dong) {
      await user.update({
        curLocationA: null,
        curLocationB: null,
        curLocationC: null,
      });
      logger.info(
        `DELETE users/location/:dong | userId : ${req.params.id}에서 ${dong} 삭제에 성공하였습니다.`,
      );
      return util.jsonResponse(
        res,
        200,
        '[동 삭제 api] 동네 삭제에 성공하였습니다.',
        true,
        null,
      );
    } else if (user.curLocation3 === dong) {
      if (user.curLocationC === null) {
        logger.info(
          `DELETE users/location/:dong | userId : ${req.params.id}에서 동네가 하나만 있습니다.`,
        );
        return util.jsonResponse(
          res,
          405,
          '[동 삭제 api] 동네가 하나만 있을 경우 지울 수 없습니다.',
          false,
          null,
        ); // #swagger.responses[405]
      }
      await user.update({
        curLocation1: user.curLocationA,
        curLocation2: user.curLocationB,
        curLocation3: user.curLocationC,
      });
      await user.update({
        curLocationA: null,
        curLocationB: null,
        curLocationC: null,
      });
      logger.info(
        `DELETE users/location/:dong | userId : ${req.params.id}에서 ${dong} 삭제에 성공하였습니다.`,
      );
      return util.jsonResponse(
        res,
        200,
        '[동 삭제 api] 동네 삭제에 성공하였습니다.',
        true,
        null,
      );
    } else {
      logger.info(
        `DELETE users/location/:dong | userId : ${req.params.id}에서 일치하는 동네가 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        '[동 삭제 api] 일치하는 동네가 없습니다.',
        false,
        null,
      ); // #swagger.responses[404]
    }
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[동 삭제] DELETE users/location/:dong 서버 에러',
      false,
      error,
    ); // #swagger.responses[500]
  }
};

const addLocation = async (req, res, next) => {
  // #swagger.summary = '동 추가하기'
  try {
    const { loc1, loc2, loc3 } = req.body;
    var token = req.headers.authorization;
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      logger.info(
        `POST users/location | userId : ${req.params.id}는 회원이 아닙니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        '[동 추가 api] userId에 해당되는 유저가 없습니다.',
        false,
        null,
      ); // #swagger.responses[404]
    }
    await user.update({
      curLocationA: loc1,
      curLocationB: loc2,
      curLocationC: loc3,
    });
    logger.info(
      `POST users/location | userId : ${req.params.id}의 동네에 ${loc1} ${loc2} ${loc3}를 추가했습니다.`,
    );
    return util.jsonResponse(
      res,
      200,
      `[동 추가 api] ${req.params.id}의 동네에 ${loc1} ${loc2} ${loc3}를 추가했습니다.`,
      true,
      null,
    );
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[동 추가] POST users/location 서버 에러',
      false,
      error,
    ); // #swagger.responses[500]
  }
};

export default {
  getUser,
  getMypageDeals,
  getNaverGeoLocation,
  getUserLocation,
  putUserNick,
  checkUserNick,
  postReportUser,
  isSetNickname,
  getLocationByNaverMapsApi,
  setLocationByNaverMapsApi,
  deletelocation,
  addLocation,
};
