import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import { Price } from '../database/models';
import { logger } from '../config/winston';
import { util } from '../modules/';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
import { priceService } from '../service';
const priceRouter = express.Router();

priceRouter.use(express.json());

/** 제목 추출 및 최저가 저장 POST */
priceRouter.get(
  '/:dealId',
  [param('dealId').notEmpty(), param('dealId').isNumeric()],
  errorValidator,
  priceService.getPrice,
);

export { priceRouter };
