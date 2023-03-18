const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const axios = require('axios');
const passport = require('passport');
const schedule = require('node-schedule');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const admin = require('firebase-admin');
const { Slack } = require('../class/slack');
const config = require('../config');

const {
  User,
  Group,
  Deal,
  Comment,
  Reply,
  DealImage,
  DealReport,
} = require('../database/models');
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { Op, Sequelize } = require('sequelize');
const { logger } = require('../config/winston');
const { timeLog } = require('console');
const { link } = require('fs');
const { util } = require('../modules/');
const dealRouter = express.Router();

AWS.config.update({
  region: 'ap-northeast-2',
  accessKeyId: config.s3AccessKeyID,
  secretAccessKey: config.s3SecretAccessKey,
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'nbreadimg',
    key: async (req, file, cb) => {
      const dealImages = await DealImage.findAll({
        where: { dealId: req.params.dealId },
      });
      console.log(dealImages);
      if (dealImages.length > 0) {
        for (let dealImage of dealImages) {
          await dealImage.destroy(); // 그냥 삭제하는 것이 맞는가? 거래 수정됬을 때 어떻게 수정하면 좋을까?
        }
      }
      cb(null, `original/${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 이미지 최대 size 5MB
});

dealRouter.post('/:dealId/img/coupang', async (req, res) => {
  // #swagger.summary = '쿠팡 썸네일 이미지 업로드'
  try {
    const { url } = req.body;
    const dealId = parseInt(req.params.dealId);
    if (Number.isNaN(dealId)) {
      logger.info(
        `[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang 에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`,
      );
      return util.jsonResponse(
        res,
        400,
        `[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang 에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`,
        false,
      );
    }
    const targetDeal = await Deal.findOne({ where: { id: dealId } });
    if (targetDeal === null) {
      logger.info(
        `[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        `[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`,
        false,
      );
    }
    const coupangImage = await DealImage.create({
      dealImage: url,
      dealId: dealId,
    });
    logger.info(
      `dealId : ${dealId}에 dealImageId : ${coupangImage.id} 가 생성되었습니다.`,
    );
    return util.jsonResponse(
      res,
      200,
      `dealId : ${dealId}에 쿠팡 썸네일 이미지가 생성되었습니다.`,
      true,
      null,
    );
  } catch (error) {
    logger.error(
      `[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang ${error}`,
    );
    util.jsonResponse(
      res,
      500,
      '[쿠팡 썸네일 이미지 생성] POST /deals/:dealId/img/coupang',
      false,
    );
  }
});

dealRouter.post('/:dealId/img', upload.array('img'), async (req, res) => {
  // #swagger.summary = 'S3 이미지(Array) 업로드'
  try {
    const dealId = parseInt(req.params.dealId);
    if (Number.isNaN(dealId)) {
      logger.info(
        `[거래 이미지 생성] POST /deals/:dealId/img의 :dealId에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`,
      );
      return util.jsonResponse(
        res,
        400,
        `[거래 이미지 생성] POST /deals/:dealId/img의 :dealId에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`,
        false,
      );
    }
    const targetDeal = await Deal.findOne({ where: { id: dealId } });
    if (targetDeal === null) {
      logger.info(
        `[거래 이미지 생성] POST /deals/:dealId/img의 dealId : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        `[거래 이미지 생성] POST /deals/:dealId/img의 dealId : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`,
        false,
      );
    }
    const result = [];
    for (let i of req.files) {
      console.log(i);
      const originalUrl = i.location;
      // const newUrl = originalUrl.replace(/\/original\//, '/thumb/');
      result.push(originalUrl);
    }
    if (result.length > 0) {
      for (let url of result) {
        console.log(url);
        const tmpImage = await DealImage.create({
          dealImage: url,
          dealId: dealId,
        });
        logger.info(
          `dealId : ${dealId}에 dealImageId : ${tmpImage.id} 가 생성되었습니다.`,
        );
      }
    }
    return util.jsonResponse(
      res,
      200,
      `dealId : ${dealId}에 ${result.length}개의 이미지가 생성되었습니다.`,
      true,
      `${result}`,
    );
  } catch (error) {
    logger.error(`[거래 이미지 생성] POST /deals/:dealId/img ${error}`);
    util.jsonResponse(
      res,
      500,
      '[거래 이미지 생성] POST /deals/:dealId/img',
      false,
    );
  }
});

// 전체거래(홈화면) deals/all/?isDealDone={}&offset={}&limit={}
// offset, limit 적용 방안 생각해야됨.
dealRouter.get('/all/:range/:region', verifyToken, async (req, res, next) => {
  // #swagger.summary = '지역 전체 거래 GET'
  try {
    var token = req.headers.authorization;
    console.log(`token is ${token}`);
    var allDeal;
    if (req.params.range === 'loc1') {
      allDeal = await Deal.findAll({
        where: {
          [Op.or]: [{ loc1: req.params.region }, { loc1: 'global' }],
        },
        order: [['createdAt', 'DESC']],
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
    } else if (req.params.range === 'loc2') {
      if (req.params.region === '강남구' || req.params.region === '서초구') {
        allDeal = await Deal.findAll({
          where: {
            [Op.or]: [
              { loc2: '강남구' },
              { loc2: '서초구' },
              { loc2: 'global' },
            ],
          },
          order: [['createdAt', 'DESC']],
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
      } else {
        allDeal = await Deal.findAll({
          where: {
            [Op.or]: [{ loc2: req.params.region }, { loc2: 'global' }],
          },
          order: [['createdAt', 'DESC']],
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
      }
    } else if (req.params.range === 'loc3') {
      allDeal = await Deal.findAll({
        where: {
          [Op.or]: [{ loc3: req.params.region }, { loc3: 'global' }],
        },
        order: [['createdAt', 'DESC']],
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
    }
    for (let i = 0; i < allDeal.length; i++) {
      var toSetStatus = allDeal[i];
      toSetStatus['mystatus'] = 'user';
      var dDate = new Date(toSetStatus['dealDate']);
      dDate.setHours(dDate.getHours() + 9);
      toSetStatus['dealDate'] = dDate;
      const nowDate = new Date(Date.now());
      nowDate.setHours(nowDate.getHours() + 9);
      console.log(toSetStatus['dealDate']);
      console.log(nowDate);
      console.log(toSetStatus['dealDate'] < nowDate);
      if (toSetStatus['dealDate'] < nowDate) {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
          toSetStatus['status'] = '거래완료';
        else toSetStatus['status'] = '모집실패';
      } else {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
          toSetStatus['status'] = '모집완료';
        else toSetStatus['status'] = '모집중';
      }
    }

    if (token != undefined) {
      //mystatus 처리->"제안자" "참여자" ""
      for (let i = 0; i < allDeal.length; i++) {
        var toSetStatus = allDeal[i];
        if (toSetStatus['userId'] === req.decoded.id) {
          toSetStatus['mystatus'] = '제안자';
        } else {
          var groupMember = [];
          var group = await Group.findAll({
            where: { dealId: toSetStatus['id'] },
          });
          for (let j = 0; j < group.length; j++) {
            groupMember.push(group[j]['userId']);
          }
          if (groupMember.includes(req.decoded.id)) {
            toSetStatus['mystatus'] = '참여자';
          }
        }
      }
    }
    var testres = { capsule: allDeal };
    return util.jsonResponse(res, 200, '전체 글 리스트', true, testres);
  } catch (error) {
    logger.error(`[홈 전체 글 리스트] GET /deals/all/:region ${error}`);
    util.jsonResponse(
      res,
      500,
      `[홈 전체 글 리스트] GET /deals/all/:region`,
      false,
    );
  }
});

dealRouter.get('/all/:region', verifyToken, async (req, res, next) => {
  // #swagger.summary = '지역 전체 거래 GET(삭제예정)'
  const gangnam = [
    '압구정동',
    '신사동',
    '청담동',
    '논현동',
    '삼성동',
    '역삼동',
    '대치동',
    '도곡동',
    '개포동',
    '일원동',
    '수서동',
    '자곡동',
    '율현동',
    '세곡동',
  ];
  const seocho = [
    '서초동',
    '반포동',
    '방배동',
    '잠원동',
    '내곡동',
    '양재동',
    '우면동',
    '신원동',
    '염곡동',
    '원지동',
  ];
  const guanak = ['남현동', '봉천동', '신림동'];
  const guangjin = [
    '중곡동',
    '군자동',
    '능동',
    '화양동',
    '자양동',
    '구의동',
    '광장동',
  ];
  const guArray = [gangnam, seocho, guanak, guangjin];
  const guName = ['강남구', '서초구', '관악구', '광진구'];

  try {
    var token = req.headers.authorization;
    console.log(`token is ${token}`);
    let region;
    console.log(`Ex region : ${region}`);
    for (let i = 0; i < guArray.length; i++) {
      let gu = guArray[i];
      for (let dong of gu) {
        if (dong == req.params.region) {
          console.log(`${dong} AND ${req.params.region}`);
          region = guName[i];
          break;
        }
      }
      if (region !== undefined) break;
    }
    console.log(`After Region : ${region}`);
    if (region === '서초구' || region === '강남구') {
      console.log(`THIS REGION IS ${region}`);
      const afterDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { loc2: '강남구' },
                { loc2: '서초구' },
                { loc2: 'global' },
              ],
            },
            { dealDate: { [Op.gt]: Date.now() } },
          ],
        },
        order: [
          [Sequelize.fn('FIELD', Sequelize.col('loc2'), region), 'DESC'],
          ['loc2', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      const beforeDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { loc2: '강남구' },
                { loc2: '서초구' },
                { loc2: 'global' },
              ],
            },
            { dealDate: { [Op.lt]: Date.now() } },
          ],
        },
        order: [
          [Sequelize.fn('FIELD', Sequelize.col('loc2'), region), 'DESC'],
          ['loc2', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      var allDeal = [...afterDeal, ...beforeDeal];
      console.log('ALL DEAL IS CREATED');
    } else if (region === undefined) {
      logger.info(
        `서초, 광진, 강남, 관악 이외 : ${req.params.region} 사용자가 홈 거래를 불러왔습니다.`,
      );
      const afterDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ loc3: req.params.region }, { loc3: 'global' }],
            },
            { dealDate: { [Op.gt]: Date.now() } },
          ],
        },
        order: [
          ['loc3', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      const beforeDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ loc3: req.params.region }, { loc3: 'global' }],
            },
            { dealDate: { [Op.lt]: Date.now() } },
          ],
        },
        order: [
          ['loc3', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      var allDeal = [...afterDeal, ...beforeDeal];
    } else {
      logger.info(`${region} 홈 모든 거래 info`);
      const afterDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ loc2: region }, { loc2: 'global' }],
            },
            { dealDate: { [Op.gt]: Date.now() } },
          ],
        },
        order: [
          ['loc2', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      const beforeDeal = await Deal.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ loc2: region }, { loc2: 'global' }],
            },
            { dealDate: { [Op.lt]: Date.now() } },
          ],
        },
        order: [
          ['loc2', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
      var allDeal = [...afterDeal, ...beforeDeal];
    }
    for (let i = 0; i < allDeal.length; i++) {
      var toSetStatus = allDeal[i];
      toSetStatus['mystatus'] = 'user';
      var dDate = new Date(toSetStatus['dealDate']);
      dDate.setHours(dDate.getHours() + 9); //2.0.1업데이트 시 +9해주기
      toSetStatus['dealDate'] = dDate;
      if (toSetStatus['dealDate'] < new Date(Date.now())) {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
          toSetStatus['status'] = '거래완료';
        else toSetStatus['status'] = '모집실패';
      } else {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember'])
          toSetStatus['status'] = '모집완료';
        else toSetStatus['status'] = '모집중';
      }
    }

    if (token != undefined) {
      //mystatus 처리-> "제안자" "참여자" ""
      for (let i = 0; i < allDeal.length; i++) {
        var toSetStatus = allDeal[i];
        if (toSetStatus['userId'] === req.decoded.id) {
          toSetStatus['mystatus'] = '제안자';
        } else {
          var groupMember = [];
          var group = await Group.findAll({
            where: { dealId: toSetStatus['id'] },
          });
          for (let j = 0; j < group.length; j++) {
            groupMember.push(group[j]['userId']);
          }
          if (groupMember.includes(req.decoded.id)) {
            toSetStatus['mystatus'] = '참여자';
          }
        }
      }
    }
    var testres = { capsule: allDeal };
    return util.jsonResponse(res, 200, '전체 글 리스트', true, testres);
  } catch (error) {
    logger.error(`${error}  [홈 전체 글 리스트] GET /deals/all/:region`);
    util.jsonResponse(
      res,
      500,
      '[홈 전체 글 리스트] GET /deals/all/:region',
      false,
    );
  }
});

// 거래 생성하기
dealRouter.post('/create', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 생성'
  try {
    // console.log(req.body);
    // const parseResult = await JSON.parse(body);
    const {
      title,
      link,
      totalPrice,
      personalPrice,
      totalMember,
      dealDate,
      place,
      content,
      region,
    } = req.body; // currentMember 수정 필요.

    const user = await User.findOne({ where: { Id: req.decoded.id } });
    if (!user) {
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`,
        false,
        null,
      );
    }
    const group = await Group.create({
      amount: 1,
      userId: user.id,
    });
    const deal = await Deal.create({
      link: link,
      title: title,
      content: content,
      totalPrice: totalPrice,
      personalPrice: personalPrice,
      totalMember: totalMember,
      dealDate: new Date(dealDate), // 날짜 변환
      dealPlace: place,
      currentMember: 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯
      userId: user.id,
      loc1: user.curLocation1,
      loc2: user.curLocation2,
      loc3: user.curLocation3,
    });
    await group.update({ dealId: deal.id }); // 업데이트
    const fcmTokenJson = await axios.get(
      `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${user.id}`,
    ); // ${user.id}
    // logger.info(fcmTokenJson);
    if (Object.keys(fcmTokenJson.data).length !== 0) {
      const fcmToken = fcmTokenJson.data.Item.fcmToken;
      logger.info(`fcmToken : ${fcmToken}`);
      const fcmTopicName = `dealFcmTopic` + deal.id;
      await admin.messaging().subscribeToTopic(fcmToken, fcmTopicName);
    }

    //const categoryNLPLink = "http://3.35.167.210/category/";
    //const categoryRespnose = await axios.get(categoryNLPLink + encodeURIComponent(deal.title));
    //let categoryReturnList = [];
    //let formatedString = "처리 결과 : \n\n";
    //for (let categoryData of categoryRespnose.data){
    //formatedString = formatedString + `[${categoryData["BIG"]} - ${categoryData["SMALL"]}] : ${ categoryData["prob"]}]\n`
    //categoryReturnList.push(formatedString);
    // }
    // Slack.sendMessage(
    // {
    //   color: Slack.Colors.info,
    //  title: `[${deal.title}] 카테고리 NLP 처리 완료`,
    //text: formatedString
    // }
    // );
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
});

// 거래 세부정보
dealRouter.get('/:dealId', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 세부정보 GET'
  try {
    const deal = await Deal.findOne({
      where: { id: req.params.dealId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: DealImage,
          attributes: ['dealImage', 'id'],
        },
        { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
      ],
    });
    if (!deal) {
      logger.info(
        `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`,
        false,
        null,
      );
    } else {
      deal.mystatus = 'user';
      if (deal.userId === req.decoded.id) {
        deal.mystatus = '제안자';
      } else {
        var groupMember = [];
        var group = await Group.findAll({ where: { dealId: deal.id } });
        for (let j = 0; j < group.length; j++) {
          groupMember.push(group[j]['userId']);
        }
        if (groupMember.includes(req.decoded.id)) {
          deal.mystatus = '참여자';
        }
      }
    }
    const returnDeal = deal;
    returnDeal['mystatus'] = 'user';
    var dDate = new Date(returnDeal['dealDate']);
    dDate.setHours(dDate.getHours() + 9);
    returnDeal['dealDate'] = dDate;
    const nowDate = new Date(Date.now());
    nowDate.setHours(nowDate.getHours() + 9);
    if (returnDeal['dealDate'] < nowDate) {
      if (returnDeal['currentMember'] === returnDeal['totalMember'])
        returnDeal['status'] = '거래완료';
      else returnDeal['status'] = '모집실패';
    } else {
      if (returnDeal['currentMember'] === returnDeal['totalMember'])
        returnDeal['status'] = '모집완료';
      else returnDeal['status'] = '모집중';
    }
    if (returnDeal['userId'] === req.decoded.id) {
      returnDeal['mystatus'] = '제안자';
    } else {
      var groupMember = [];
      var group = await Group.findAll({ where: { dealId: returnDeal['id'] } });
      for (let j = 0; j < group.length; j++) {
        groupMember.push(group[j]['userId']);
      }
      if (groupMember.includes(req.decoded.id)) {
        returnDeal['mystatus'] = '참여자';
      }
    }
    logger.info(`dealId : ${req.params.dealId} 에 대한 거래정보를 반환합니다.`);
    return util.jsonResponse(
      res,
      200,
      `dealId ${deal.id} 의 거래 정보`,
      true,
      returnDeal,
    );
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[거래 세부정보] GET /deals/:dealId 서버 에러',
      false,
      null,
    );
  }
});

// 거래 수정하기
dealRouter.put('/:dealId', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 수정'
  const {
    title,
    content,
    totalPrice,
    personalPrice,
    totalMember,
    dealDate,
    place,
    currentMember,
    link,
  } = req.body;
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId } });
    if (!deal) {
      logger.info(
        `dealId : ${req.params.dealId}에 매칭되는 거래를 찾을 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        404,
        `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`,
        false,
        null,
      );
    }
    if (deal.userId != req.decoded.id) {
      logger.info(
        `userId : ${req.decoded.id}는 거래를 수정할 권한이 없습니다.`,
      );
      return util.jsonResponse(
        res,
        403,
        `글의 작성자만 거래를 수정할 수 있습니다.`,
        false,
        null,
      );
    }
    const groups = await Group.findAll({ where: { dealId: deal.id } });
    if (groups.length > 1) {
      logger.info(
        `참여자가 ${groups.length - 1}명 있으므로 거래를 수정 할 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        400,
        `참여자가 ${groups.length - 1}명 있으므로 거래를 수정 할 수 없습니다.`,
        false,
        null,
      );
    }
    await deal.update({
      link: link,
      title: title,
      content: content,
      totalPrice: totalPrice,
      personalPrice: personalPrice,
      totalMember: totalMember,
      dealDate: new Date(dealDate), // 날짜 변환
      dealPlace: place,
      currentMember: 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯 -> MVP에서는 일단 안주는걸로.
      userId: req.params.userId,
    });
    logger.info(`${deal.id} 의 거래를 수정하였습니다.`);
    return util.jsonResponse(
      res,
      200,
      deal.id + `의 거래를 수정하였습니다.`,
      true,
      deal,
    );
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[거래 수정] PUT deals/:dealId 서버 에러',
      false,
      null,
    );
  }
});

// 거래 삭제
dealRouter.delete('/:dealId', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 삭제'
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId } });
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
    const groups = await Group.findAll({ where: { dealId: deal.id } });
    if (groups.length > 1) {
      return util.jsonResponse(
        res,
        400,
        '참여자가 있으므로 거래를 삭제할 수 없습니다.',
        false,
        null,
      );
    }
    deal.destroy({ truncate: true });
    const comment = Comment.findAll({ where: { dealId: req.params.dealId } });
    console.log(comment);
    //comment.update({isDeleted:1});
    const reply = Reply.findAll({ where: { dealId: req.params.dealId } });
    console.log(reply);
    //reply.update({isDeleted:1});
    return util.jsonResponse(
      res,
      200,
      '정상적으로 거래를 삭제하였습니다.',
      true,
      null,
    );
  } catch (error) {
    logger.error(error);
    return util.jsonResponse(
      res,
      500,
      '[거래 삭제] Delete /deals/:dealId 서버 에러',
      false,
      null,
    );
  }
});

// 참여자 : 거래 참여하기
dealRouter.post(
  '/:dealId/join/:userId',
  verifyToken,
  async (req, res, next) => {
    // #swagger.summary = '거래 참여'
    try {
      const user = await User.findOne({ where: { Id: req.params.userId } });
      const deal = await Deal.findOne({ where: { Id: req.params.dealId } });
      const isJoin = await Group.findOne({
        where: { userId: req.params.userId, dealId: req.params.dealId },
      });
      if (!user) {
        return util.jsonResponse(
          res,
          404,
          `userId : ${req.params.userId} 에 해당되는 유저가 없습니다.`,
          false,
          null,
        );
      }
      if (!deal) {
        return util.jsonResponse(
          res,
          404,
          `dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`,
          false,
          null,
        );
      }
      if (isJoin) {
        return util.jsonResponse(
          res,
          403,
          `userId : ${req.params.userId} 는 이미 거래에 참여했습니다.`,
          false,
          null,
        ); // 추가 구매 수량?
      }
      const expireDate = deal.dealDate.setDate(deal.dealDate.getDate());
      if (expireDate < Date.now()) {
        return util.jsonResponse(
          res,
          401,
          `거래 모집 시간이 지났습니다.`,
          false,
          null,
        );
      }
      const stock = deal.totalMember - deal.currentMember;
      if (stock <= 0) {
        logger.log(stock);
        return util.jsonResponse(
          res,
          400,
          `구매 가능한 수량 ${stock} 내의 수를 입력해야 합니다.`,
          false,
          null,
        );
      }
      const group = await Group.create({
        amount: 1,
        userId: req.params.userId,
        dealId: req.params.dealId,
      });
      await deal.update({ currentMember: deal.currentMember + 1 });
      const fcmTopicName = `dealFcmTopic` + deal.id;
      // 그룹에 있는 모든 유저들에게
      const message = {
        notification: {
          title: `N빵 신규 참여 알림`,
          body: `${user.nick}님이 N빵에 참여하여 인원이 ${deal.currentMember} / ${deal.totalMember} 가 되었습니다!`,
        },
        data: {
          type: 'deal',
          dealId: `${deal.id}`,
        },
        topic: fcmTopicName,
      };
      await admin.messaging().send(message);

      const fcmTokenJson = await axios.get(
        `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${user.id}`,
      ); // ${user.id}
      if (Object.keys(fcmTokenJson.data).length !== 0) {
        const fcmToken = fcmTokenJson.data.Item.fcmToken;
        logger.info(`fcmToken : ${fcmToken}`);
        await admin.messaging().subscribeToTopic(fcmToken, fcmTopicName);
      }

      return util.jsonResponse(res, 200, `거래 참여가 완료되었습니다.`, true, {
        deal: deal,
        group: group,
      });
    } catch (error) {
      logger.error(error);
      return util.jsonResponse(
        res,
        500,
        `[거래 참여] deals/:dealId/join/:userId 서버 에러`,
        false,
        null,
      );
    }
  },
);

// 거래에 대응되는 userId에 대해 제안자, 참여자 여부
dealRouter.get('/:dealId/users/:userId', async (req, res, next) => {
  // #swagger.summary = '거래 유저 상태(참여자, 제안자, 참여하지 않음)'
  try {
    const user = await User.findOne({ where: { Id: req.params.userId } });
    if (!user) {
      return util.jsonResponse(
        res,
        404,
        'userId에 해당되는 유저를 찾을 수 없습니다.',
        false,
        null,
      );
    }
    let status, description;
    const group = await Group.findOne({
      where: { userId: req.params.userId, dealId: req.params.dealId },
    });
    if (!group) {
      description = '참여하지 않음';
      status = 0;
    } else {
      const deal = await group.getDeal();
      // console.log("deal.userId : " + typeof deal.userId);
      // console.log("req.params.userId : " + typeof req.params.userId);
      if (deal.userId == req.params.userId) {
        //deal.userId는 number 형이고 req.params.userId는 string형 이므로 == 를 사용해야함.
        description = '제안자';
        status = 2;
      } else {
        description = '참여자';
        status = 1;
      }
    }
    const result = {
      participation: status,
      description: description,
      userId: req.params.userId,
      dealId: req.params.dealId,
    };
    return util.jsonResponse(
      res,
      200,
      '거래에 대한 상태를 반환합니다.',
      true,
      result,
    );
  } catch (error) {
    logger.log(error);
    return util.jsonResponse(
      res,
      500,
      '[거래 유저 상태] GET deals/:dealId/users/:userId 서버 에러',
      false,
      null,
    );
  }
});

dealRouter.post('/:dealId/report', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 신고'
  try {
    const { title, content } = req.body;
    if (req.params.dealId == ':dealId') {
      return util.jsonResponse(
        res,
        404,
        `parameter :dealId가 필요합니다.`,
        false,
        null,
      );
    }
    const user = await User.findOne({ where: { Id: req.decoded.id } });
    const deal = await Deal.findOne({ where: { Id: req.params.dealId } });

    if (!user) {
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`,
        false,
        null,
      );
    }
    if (!deal) {
      logger.info(`dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`,
        false,
        null,
      );
    }
    if (user.id === deal.userId) {
      logger.info(
        `userId : ${req.decoded.id} 자신이 작성한 글을 신고 할 수 없습니다.`,
      );
      return util.jsonResponse(
        res,
        403,
        `userId : ${req.decoded.id} 자신이 작성한 글을 신고 할 수 없습니다.`,
        false,
        null,
      );
    }
    const dealReport = await DealReport.create({
      title: title,
      content: content,
      reporterId: req.decoded.id,
      dealId: req.params.dealId,
    });
    logger.info(
      `${req.decoded.id}님이 dealId : ${req.params.dealId}글을 신고 하였습니다.`,
    );
    return util.jsonResponse(
      res,
      200,
      `${req.decoded.id}님이 dealId : ${req.params.dealId}글을 신고 하였습니다.`,
      true,
      dealReport,
    );
  } catch (error) {
    console.error(error);
    return util.jsonResponse(
      res,
      500,
      '[거래 신고] deals/:dealId/report 서버 에러',
      false,
      null,
    );
  }
});

dealRouter.post('/:dealId/endRecruit', verifyToken, async (req, res, next) => {
  // #swagger.summary = '모집 마감하기'
  // #swagger.deprecated = true
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId } });
    if (!deal) {
      return util.jsonResponse(
        res,
        404,
        'dealId에 매칭되는 거래를 찾을 수 없습니다.',
        false,
        null,
      );
    }
    if (deal.userId != req.decoded.id) {
      return util.jsonResponse(
        res,
        403,
        '글의 작성자만 모집을 마감 할 수 있습니다.',
        false,
        null,
      );
    }
    deal.update({ where: { isRecruitDone: true } });
    const groups = await Group.findAll({ where: { dealId: deal.id } });
    const result = { deal: deal, groups: groups };
    return util.jsonResponse(
      res,
      200,
      '모집이 정상적으로 마감되었습니다.',
      true,
      result,
    );
  } catch (error) {
    console.error(error);
    return util.jsonResponse(
      res,
      500,
      '[모집 마감 - 삭제됨] POST /deals/:dealId/endRecruit 서버 에러',
      false,
      null,
    );
  }
});

//관리자용 api
//deals Table의 loc1, loc2, loc3을 채우기 위함
dealRouter.post('/admin/fillLocation', async (req, res, next) => {
  // #swagger.summary = '관리자 : deals Table loc1,2,3'
  try {
    const deal = await Deal.findAll();
    for (let i = 0; i < deal.length; i++) {
      var curDeal = deal[i];
      console.log(curDeal.userId);
      const user = await User.findOne({
        where: { id: curDeal.userId },
        paranoid: false,
      });
      await curDeal.update({ loc1: user.curLocation1 });
      await curDeal.update({ loc2: user.curLocation2 });
      await curDeal.update({ loc3: user.curLocation3 });
    }
    return util.jsonResponse(
      res,
      200,
      '[관리자용 api] POST /admin/fillLocation 가 성공적으로 수행되었습니다.',
      true,
      null,
    );
  } catch (error) {
    console.error(error);
    return util.jsonResponse(
      res,
      500,
      '[관리자용 api] POST /admin/fillLocation 에러',
      false,
      null,
    );
  }
});

// router.post('/:dealId/endDeal', isLoggedIn, async(req, res, next) => {
//   try{
//     const deal = await Deal.findOne({ where : {id : req.params.dealId}});
//     if(!deal){
//       return util.jsonResponse(res, 404, "dealId에 매칭되는 거래를 찾을 수 없습니다.", false, null)
//     }
//     if(deal.userId != req.user.id){
//       return util.jsonResponse(res, 403, '글의 작성자만 거래를 마감할 수 있습니다.', false, null)
//     }
//     // 거래 시간이 지난 후에만 거래를 마감 할 수 있게?
//     deal.update({isDealDone : true, isRecruitDone : true}); // 일단 recruitDone 확인하지 않고 둘다 true로 만들어줌.
//     const groups = await Group.findAll({where : {dealId : deal.id}});
//     const result = {deal : deal, groups : groups};
//     return util.jsonResponse(res, 200, "거래가 정상적으로 마감되었습니다.", true, result);
//   }
//   catch (error){
//     logger.error(error);
//     return util.jsonResponse(res, 500, "서버 에러", false, null)
//   }
// })

dealRouter.post('/fcmPush/:fcmToken', async (req, res, next) => {
  try {
    await admin.messaging().sendMulticast({
      tokens: [req.params.fcmToken],
      notification: {
        title: '딱 맞는 상품이 N빵에 올라왔어요!',
        body: '젤라 인텐션 레깅스 1+1 같이사요! / 11/18(금) 오후 9시 서울대입구역',
      },
      data: {
        type: 'deal',
        dealId: '347',
      },
    });
    return res.status(200).send();
  } catch (error) {
    console.log(error);
  }
});

export { dealRouter };
