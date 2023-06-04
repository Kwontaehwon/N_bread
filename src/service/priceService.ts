import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/winston';
import { Price } from '../database/models';
import { priceModule, productModule, util } from '../modules';
import config from '../config';
import request from 'typescript-require';
import { Slack2 } from '../class/slack2';
import { Op } from 'sequelize';
import {
  dealImageRepository,
  dealRepository,
  priceRepository,
} from '../repository';
import { _getUnitPriceOrGram } from '../modules/priceModules/priceModule';
import { priceDto } from '../dto/price/priceDto';

const getPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dealId } = req.params;
    const deal = await dealRepository.findDealById(+dealId);
    const dealImage = await dealImageRepository.findDealImageById(+dealId);
    var imageLink = !dealImage ? config.defaultDealImage : dealImage.dealImage;

    const totalPrice = deal.totalPrice;
    const particlePrice = deal.personalPrice;
    var title = deal.title;

    /**단위 가격 추출 */
    const extractedPrice = priceModule._getUnitPriceOrGram(
      totalPrice,
      particlePrice,
      title,
    );
    const priceToSave = extractedPrice.unitPrice;
    const gramToAdd = extractedPrice.gramToAdd;

    /**추출한 단위 가격 저장 */
    const isDealExist = await priceRepository.isPriceExist(+dealId);

    if (!isDealExist) {
      const priceDto: priceDto = {
        dealId: +dealId,
        title: deal.title,
        image: imageLink,
        lPrice: priceToSave,
        mallName: 'N빵',
      };
      await priceRepository.savePriceInfo(priceDto);
    }

    logger.info(`추출된 단위 가격은 ${priceToSave}원입니다.`);

    /** 상품명 추출 */
    var jsonArray = new Array();
    logger.info(`[가격비교 저장] \"${title}\"에서 상품명 추출을 시도합니다.`);

    const productName = await productModule._getProductName(
      title,
      gramToAdd,
    );

    logger.info(`${productName}로 네이버 쇼핑에 검색을 시도합니다.`);
    var url =
      'https://openapi.naver.com/v1/search/shop.json?query=' +
      encodeURI(productName) +
      '&display=4'; // JSON 결과
    var options = {
      url: url,
      headers: {
        'X-Naver-Client-Id': config.naverClientId,
        'X-Naver-Client-Secret': config.NaverClientSecret,
      },
    };
    await request.get(options, async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        var item = JSON.parse(body)['items'];
        const existDeal = await Price.findOne({
          where: {
            dealId: req.params.dealId,
            mallName: { [Op.not]: 'N빵' },
          },
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
  } catch (error) {
    next(error);
  }
};

export { getPrice };
