import { dealImageUpload } from '../middlewares/upload';

const express = require('express');
import { dealService } from '../service';
import { body, param } from 'express-validator';
import { User, Group, Deal, DealImage, DealReport } from '../database/models';
import { verifyToken } from '../middlewares/middleware';
import { Op, Sequelize } from 'sequelize';
import { logger } from '../config/winston';
import { util } from '../modules';
import { errorValidator } from '../modules/error/errorValidator';
const dealRouter = express.Router();

dealRouter.post(
  '/:dealId/img/coupang',
  param('dealId').isNumeric(),
  errorValidator,
  async (req, res, next) => {
    // #swagger.summary = '쿠팡 썸네일 이미지 업로드'
    await dealService.createCoupangImage(req, res, next);
  },
);

dealRouter.post(
  '/:dealId/img',
  [param('dealId').isNumeric()],
  errorValidator,
  dealImageUpload.array('img'),
  dealService.createDealImage,
);

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
      {},
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
      {},
    );
  }
});

// 거래 생성하기
dealRouter.post('/create', verifyToken, dealService.createDeal);

// 거래 세부정보
dealRouter.get(
  '/:dealId',
  [param('dealId').isNumeric()],
  errorValidator,
  verifyToken,
  dealService.readDealDetail,
  async (req, res, next) => {
    // #swagger.summary = '거래 세부정보 GET'
  },
);

// 거래 수정하기
dealRouter.put(
  '/:dealId',
  [param('dealId').isNumeric()],
  errorValidator,
  verifyToken,
  dealService.updateDeal,
);

// 거래 삭제
dealRouter.delete(
  '/:dealId',
  [param('dealId').isNumeric()],
  errorValidator,
  verifyToken,
  dealService.deleteDeal,
);

// 참여자 : 거래 참여하기
dealRouter.post(
  '/join/:dealId',
  [param('dealId').isNumeric()],
  errorValidator,
  verifyToken,
  dealService.joinDeal,
);

// 거래에 대응되는 userId에 대해 제안자, 참여자 여부
dealRouter.get(
  '/:dealId/users/:userId',
  errorValidator,
  dealService.userStatusInDeal,
);

dealRouter.post(
  '/:dealId/report',
  verifyToken,
  [param('dealId').isNumeric()],
  errorValidator,
  dealService.reportDeal,
);

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

export { dealRouter };
