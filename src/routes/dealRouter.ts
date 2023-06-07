import { dealImageUpload } from '../middlewares/upload';
import express, { Router } from 'express';
import { dealService } from '../service';
import { param } from 'express-validator';
import { verifyToken } from '../middlewares/middleware';
import { errorValidator } from '../modules/error/errorValidator';
const dealRouter: Router = express.Router();

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
dealRouter.get(
  '/all/:range/:region',
  [param('range').isString(), param('region').isString()],
  errorValidator,
  verifyToken,
  dealService.homeAllDeal,
  // #swagger.summary = '지역 전체 거래 GET'
);

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
