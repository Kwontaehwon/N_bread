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

export { dealRouter };
