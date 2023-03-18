const express = require('express');
const cors = require('cors');
const url = require('url');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const spawn = require('child_process').spawn;
const { Slack2 } = require('../class/slack2');

const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const {
  User,
  Group,
  Deal,
  Comment,
  Reply,
  sequelize,
  Price,
  DealImage,
} = require('../database/models');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');
const { Op } = require('sequelize');
const { logger } = require('../config/winston');
const admin = require('firebase-admin');
const { env } = require('process');
var request = require('request');
const { error } = require('console');
const { util } = require('../modules/');
const priceRouter = express.Router();

priceRouter.use(express.json());

// POST price/:productName
priceRouter.post('/:dealId', async (req, res) => {
  //python test
  const deal = await Deal.findOne({
    where: { id: req.params.dealId },
    paranoid: false,
  });
  const dealImage = await DealImage.findOne({
    where: { dealId: req.params.dealId },
    paranoid: false,
  });
  var imageLink =
    'https://nbreadimg.s3.ap-northeast-2.amazonaws.com/original/1668848067518__N%EB%B9%B5%20%EB%A1%9C%EA%B3%A0-001%20%282%29.png';
  try {
    if (dealImage) {
      imageLink = dealImage.dealImage;
    }
    if (!deal) {
      util.jsonResponse(
        res,
        404,
        `${req.params.dealId}에 해당하는 거래를 찾을 수 없습니다`,
        false,
        null,
      );
    }

    const totalPrice = deal.totalPrice;
    const particlePrice = deal.personalPrice;
    var jsonArray = new Array();
    var title2 = deal.title;
    var title = deal.title;

    title2 = title2.replace(/\s/g, '');
    var total = title2.match(/\총\d?\d?\d?\d/);
    var partial = title2.match(/\d?\d?\d\개씩/);
    var onePlus = title2.includes('1+1');
    var twoPlus = title2.includes('2+1') || title2.includes('1+2');

    var unitPrice = 0;

    if (total) {
      total = total[0].replace('총', '');
      total *= 1;
      unitPrice = totalPrice / total;
    } else if (partial) {
      partial = partial[0].replace('개씩', '');
      partial *= 1;
      unitPrice = particlePrice / partial;
    } else if (onePlus) {
      let numToDivide = 2;
      unitPrice = totalPrice / numToDivide;
    } else if (twoPlus) {
      let numToDivide = 3;
      unitPrice = totalPrice / numToDivide;
    }
    var priceToSave = unitPrice;

    //단위 가격을 추출하지 못했을 경우 : g 추출 시도
    var gramToAdd = ' ';
    if (!unitPrice) {
      var unitG = title2.match(/\d?\d?\d?\d\K?\k?\g/);
      if (unitG) {
        gramToAdd += unitG[0];
      }
      priceToSave = deal.personalPrice;
    } else {
      gramToAdd += '1개';
    }
    const isDealExist = await Price.findOne({
      where: { dealId: req.params.dealId },
    });
    if (!isDealExist) {
      await Price.create({
        dealId: req.params.dealId,
        title: deal.title,
        image: imageLink,
        lPrice: priceToSave,
        mallName: 'N빵',
      });
    }

    logger.info(`추출된 단위 가격은 ${priceToSave}원입니다.`);
  } catch (e) {
    util.jsonResponse(
      res,
      401,
      '[가격비교 저장] 단위가격 추출 중 오류가 발생하였습니다.',
      false,
      e,
    );
  }
  //상품명 추출
  //const text = deal.title;
  logger.info(`[가격비교 저장] \"${title}\"에서 상품명 추출을 시도합니다.`);
  const text = title;

  var answer = '';
  try {
    const result_01 = await spawn('python3', ['../modules/getTopic.py', title]);

    await result_01.stdout.on('data', async (result) => {
      console.log('spawn in');
      console.log(result);
      console.log(result.toString());
      answer = result.toString();
      if (answer === '오류발생') {
        logger.info(`Mecab에러 발생`);
        answer = '';
      }
      logger.info(`추출된 상품명은 ${answer}입니다.`);
      const productName = answer + gramToAdd;
      //const productName = "";
      logger.info(`${productName}로 네이버 쇼핑에 검색을 시도합니다.`);
      const client_id = env.NAVER_DEVELOPER_CLIENTID;
      const client_secret = env.NAVER_DEVELOPER_CLIENTSECRET;
      var url =
        'https://openapi.naver.com/v1/search/shop.json?query=' +
        encodeURI(productName) +
        '&display=4'; // JSON 결과
      var options = {
        url: url,
        headers: {
          'X-Naver-Client-Id': client_id,
          'X-Naver-Client-Secret': client_secret,
        },
      };
      await request.get(options, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          var item = JSON.parse(body)['items'];
          const existDeal = await Price.findOne({
            where: { dealId: req.params.dealId, mallName: { [Op.not]: 'N빵' } },
          });
          if (!existDeal) {
            for (let i = 0; i < item.length; i++) {
              let mobileLink = item[i]['link'].toString();
              let mob = mobileLink.split('id=');
              let processedTitle = item[i]['title'].toString();
              console.log(processedTitle);
              processedTitle = processedTitle.replaceAll('<b>', '');
              console.log(processedTitle);
              processedTitle = processedTitle.replaceAll('</b>', '');
              console.log(processedTitle);
              await Price.create({
                dealId: req.params.dealId,
                title: processedTitle,
                link: 'https://msearch.shopping.naver.com/product/' + mob[1],
                image: item[i]['image'],
                lPrice: item[i]['lprice'] * 1 + 3000,
                hPrice: item[i]['hprice'],
                mallName: item[i]['mallName'],
                productId: item[i]['productId'],
                productType: item[i]['productType'],
                brand: item[i]['brand'],
                maker: item[i]['maker'],
                category1: item[i]['category1'],
                category2: item[i]['category2'],
                category3: item[i]['category3'],
                category4: item[i]['category4'],
              });
            }
          }

          for (let i = 0; i < item.length; i++) {
            item[i].lprice = item[i].lprice * 1 + 3000;
            jsonArray.push(item[i]);
          }
          if (item.length === 0) {
            await Slack2.sendMessage({
              color: Slack2.Colors.danger,
              title: '[네이버 쇼핑 검색 결과 없음]',
              text: `${deal.title}에서 추출한 검색어 \"${productName}\"으로 검색한 결과가 없습니다.`,
            });
            return util.jsonResponse(
              res,
              403,
              `네이버 쇼핑 검색 결과가 없습니다. 검색어는 ${productName}입니다.`,
              false,
              null,
            );
          }
          await Slack2.sendMessage({
            color: Slack2.Colors.success,
            title: '[가격비교 api 결과 조회 성공]',
            text: `${deal.id}번 거래 : ${deal.title}에서 추출한 검색어 \"${productName}\"으로 가격 비교 조회에 성공하였습니다.`,
          });
          return util.jsonResponse(res, 200, '', true, jsonArray);
        } else {
          await Slack2.sendMessage({
            color: Slack2.Colors.danger,
            title: '[네이버 쇼핑 api 에러]',
            text: `네이버 쇼핑 api에서 에러가 발생했습니다. ${deal.title}에서 추출한 검색어 \"${productName}\"으로 검색하였습니다.`,
          });
          return util.jsonResponse(
            res,
            404,
            `[Lowest Price] 네이버 쇼핑 api error : 검색어는 ${productName}입니다.`,
            false,
            null,
          );
        }
      });
    });
  } catch (e) {
    logger.info(`상품명 추출 중 오류가 발생하였습니다.`);
    logger.info(e);
    await Slack2.sendMessage({
      color: Slack2.Colors.danger,
      title: '[가격비교 api 상품명 추출 에러]',
      text: `가격비교 api에서 상품명 추출 중 에러가 발생했습니다. ${deal.id}번 거래 : ${deal.title}에서 가격비교 조회를 시도하였습니다.`,
    });
    return util.jsonResponse(
      res,
      402,
      `${title}에서 상품명 추출 중 오류가 발생하였습니다.`,
      false,
      e,
    );
  }
});
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
