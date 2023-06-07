import express, { Router } from 'express';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
import { priceService } from '../service';
const priceRouter: Router = express.Router();

priceRouter.use(express.json());

/** 제목 추출 및 최저가 저장 POST */
priceRouter.get(
  '/:dealId',
  [param('dealId').notEmpty(), param('dealId').isNumeric()],
  errorValidator,
  priceService.getPrice,
);

export { priceRouter };
