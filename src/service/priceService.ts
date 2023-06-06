import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/winston';
import { priceModule, productModule } from '../modules';
import config from '../config';
import {
  dealImageRepository,
  dealRepository,
  priceRepository,
} from '../repository';
import { PriceDetailDto, PriceDto } from '../dto/price/priceDto';
import { success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';

const getPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dealId } = req.params;
    const deal = await dealRepository.findDealById(+dealId);
    const dealImage = await dealImageRepository.findDealImageById(+dealId);
    const imageLink = !dealImage
      ? config.defaultDealImage
      : dealImage.dealImage;

    const totalPrice = deal.totalPrice;
    const particlePrice = deal.personalPrice;
    const title = deal.title;

    const priceData = await priceRepository.findPriceById(+dealId);
    if (priceData.length > 1) {
      return success(res, statusCode.OK, responseMessage.SUCCESS, priceData);
    }

    /**단위 가격 존재 여부 검사 */
    const isDealExist = await priceRepository.isPriceExist(+dealId);

    /**단위 가격 추출 */
    const extractedPrice = priceModule._getUnitPrice(
      totalPrice,
      particlePrice,
      title,
    );
    const priceToSave = extractedPrice;

    logger.info(`추출된 단위 가격은 ${priceToSave}원입니다.`);
    if (!isDealExist) {
      const priceDto: PriceDto = {
        dealId: +dealId,
        title: deal.title,
        image: imageLink,
        lPrice: priceToSave,
        mallName: 'N빵',
      };
      /**추출한 단위 가격 저장 */
      await priceRepository.savePriceInfo(priceDto);
    }
    const gramToAdd = priceModule._getGram(title);
    /** 상품명 추출 */
    let jsonArray = new Array();
    logger.info(`[가격비교 저장] \"${title}\"에서 상품명 추출을 시도합니다.`);
    const productName = await productModule._getProductName(title, gramToAdd);

    logger.info(`${productName}로 네이버 쇼핑에 검색을 시도합니다.`);
    const items = await productModule._searchProduct(productName);

    for (let i = 0; i < items.length; i++) {
      let mobileLink = items[i]['link'].toString();
      let processedTitle = items[i]['title']
        .toString()
        .replaceAll('<b>', '')
        .replaceAll('</b>', '');
      const priceDetailDto: PriceDetailDto = {
        dealId: +dealId,
        title: processedTitle,
        link:
          'https://msearch.shopping.naver.com/product/' +
          mobileLink.split('id=')[1],
        image: items[i]['image'],
        lPrice: items[i]['lprice'] * 1 + 3000,
        hPrice: items[i]['hprice'],
        mallName: items[i]['mallName'],
        productId: items[i]['productId'],
        productType: items[i]['productType'],
        brand: items[i]['brand'],
        maker: items[i]['maker'],
        category1: items[i]['category1'],
        category2: items[i]['category2'],
        category3: items[i]['category3'],
        category4: items[i]['category4'],
      };
      await priceRepository.saveDetailPriceInfo(priceDetailDto);
    }

    for (let i = 0; i < items.length; i++) {
      items[i].lprice = items[i].lprice * 1 + 3000;
      jsonArray.push(items[i]);
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
