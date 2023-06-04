import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/winston';
import { Price } from '../database/models';
import { priceModule, productModule, util } from '../modules';
import config from '../config';

import {
  dealImageRepository,
  dealRepository,
  priceRepository,
} from '../repository';
import { _getUnitPriceOrGram } from '../modules/priceModules/priceModule';
import { priceDto } from '../dto/price/priceDto';
import { success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';

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
    const productName = await productModule._getProductName(title, gramToAdd);

    logger.info(`${productName}로 네이버 쇼핑에 검색을 시도합니다.`);
    const item = await productModule._searchProduct(productName);

    for (let i = 0; i < item.length; i++) {
      let mobileLink = item[i]['link'].toString();
      let processedTitle = item[i]['title']
        .toString()
        .replaceAll('<b>', '')
        .replaceAll('</b>', '');
      await Price.create({
        dealId: dealId,
        title: processedTitle,
        link:
          'https://msearch.shopping.naver.com/product/' +
          mobileLink.split('id=')[1],
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

    for (let i = 0; i < item.length; i++) {
      item[i].lprice = item[i].lprice * 1 + 3000;
      jsonArray.push(item[i]);
    }
    logger.info(
      `${deal.id}번 거래 : ${deal.title}에서 추출한 검색어 \"${productName}\"으로 가격 비교 조회에 성공하였습니다.`,
    );
    return success(res, statusCode.OK, responseMessage.SUCCESS, jsonArray);
  } catch (error) {
    next(error);
  }
};

export { getPrice };
