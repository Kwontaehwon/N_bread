import { spawn } from 'child_process';
import { errorGenerator } from '../error/errorGenerator';
import { responseMessage, statusCode } from '../constants';
import config from '../../config';
import axios from 'axios';
const _getProductName = async (title: string, gramToAdd: string) => {
  let answer = '';
  const result_01 = await spawn('python3', ['../modules/getTopic.py', title]);
  let productName = '';
  await result_01.stdout.on('data', async (result) => {
    answer = result.toString();
    if (answer === '오류발생') {
      throw errorGenerator({
        code: statusCode.BAD_REQUEST,
        message: responseMessage.MECAB_ERROR,
      });
    }
    productName = answer + gramToAdd;
  });
  return productName;
};

const _searchProduct = async (productName: string) => {
  try {
    const url =
      'https://openapi.naver.com/v1/search/shop.json?query=' +
      encodeURI(productName) +
      '&display=4'; // JSON 결과
    const options = {
      url: url,
      headers: {
        'X-Naver-Client-Id': config.naverClientId,
        'X-Naver-Client-Secret': config.NaverClientSecret,
      },
    };

    const response = await axios.get(url, options);
    if (response.status == 200) {
      const items = response.data['items'];
      if (items.length === 0)
        throw errorGenerator({
          code: statusCode.NOT_FOUND,
          message: responseMessage.SEARCH_RESULT_NOT_FOUND,
        });
      return items;
    } else {
      throw errorGenerator({
        code: statusCode.BAD_REQUEST,
        message: responseMessage.SHOPPING_API_ERROR,
      });
    }
  } catch (error) {
    throw error;
  }
};
export { _getProductName, _searchProduct };
