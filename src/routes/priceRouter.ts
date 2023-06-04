import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const spawn = require('child_process').spawn;
import { Slack2 } from '../class/slack2';
import { Deal, Price, DealImage } from '../database/models';
import { Op } from 'sequelize';
import { logger } from '../config/winston';
import { env } from 'process';
var request = require('request');
import { util } from '../modules/';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
import { getPrice } from '../service/priceService';
import { priceService } from '../service';
const priceRouter = express.Router();

priceRouter.use(express.json());

// POST price/:productName
priceRouter.post(
  '/:dealId',
  [param('dealId').notEmpty(), param('dealId').isNumeric()],
  errorValidator,
  priceService.getPrice,
);

// GET price/:dealId
priceRouter.get('/:dealId', async (req, res) => {
  console.log('가격비교 결과 조회 api 추출');
  var priceInfo = await Price.findAll({ where: { dealId: req.params.dealId } });
  console.log(priceInfo.length);
  if (priceInfo.length === 0) {
    console.log('dealId가' + req.params.dealId);
    //const link = 'http://127.0.0.1:5005/price/';
    const link = 'https://www.chocobread.shop/price/';
    await axios
      .post(link + req.params.dealId)
      .then(async (response) => {
        logger.info(
          `${req.params.dealId}번 거래의 단위가격 조회에 성공하였습니다.`,
        );
        priceInfo = await Price.findAll({
          where: { dealId: req.params.dealId },
        });
        util.jsonResponse(
          res,
          200,
          `[가격 정보 조회] : ${req.params.dealId}번 거래의 가격 정보 정보 조회에 성공했습니다.`,
          true,
          priceInfo,
        );
      })
      .catch(async function (error) {
        priceInfo = await Price.findAll({
          where: { dealId: req.params.dealId },
        });
        if (error.response.status == 401) {
          logger.info(
            `${req.params.dealId}번 거래의 단위가격 추출 중 에러가 발생했습니다.`,
          );
          util.jsonResponse(
            res,
            401,
            `[가격 정보 조회] : ${req.params.dealId}번 거래의 단위가격 추출 중 에러가 발생했습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        } else if (error.response.status == 402) {
          logger.info(
            `${req.params.dealId}번 거래의 상품명 추출 중 오류가 발생했습니다.`,
          );
          util.jsonResponse(
            res,
            402,
            `[가격 정보 조회] : ${req.params.dealId}번 거래의 상품명 추출 중 오류가 발생했습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        } else if (error.response.status == 403) {
          logger.info(
            `${req.params.dealId}번 네이버 쇼핑 검색 결과가 없습니다.`,
          );
          util.jsonResponse(
            res,
            403,
            `[가격 정보 조회] : ${req.params.dealId}번 네이버 쇼핑 검색 결과가 없습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        } else if (error.response.status == 404) {
          logger.info(
            `${req.params.dealId}번 거래의 네이버 쇼핑 api에서 오류가 발생했습니다.`,
          );
          util.jsonResponse(
            res,
            404,
            `[가격 정보 조회] : ${req.params.dealId}번 거래의 네이버 쇼핑 api에서 오류가 발생했습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        } else if (error.response.status == 405) {
          logger.info(
            `${req.params.dealId}번 거래의 네이버 쇼핑 api에서 오류가 발생했습니다.`,
          );
          util.jsonResponse(
            res,
            405,
            `[가격 정보 조회] : ${req.params.dealId}번 거래의 검색어 추출을 실패하였습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        } else {
          logger.info(
            `가격 정보조회 중${error.response.status}번 에러가 발생했습니다.`,
          );
          priceInfo = await Price.findAll({
            where: { dealId: req.params.dealId },
          });
          util.jsonResponse(
            res,
            error.response.status,
            `[가격 정보 조회] : ${req.params.dealId}번 거래의 네이버 쇼핑 api에서 오류가 발생했습니다. N빵 거래 결과를 조회합니다.`,
            true,
            priceInfo,
          );
        }
      });
  } else {
    util.jsonResponse(
      res,
      200,
      `[가격 정보 조회] : ${req.params.dealId}번 거래의 가격 정보 정보 조회에 성공했습니다.`,
      true,
      priceInfo,
    );
  }
});

export { priceRouter };
