import { spawn } from 'child_process';
import { errorGenerator } from '../error/errorGenerator';
import { responseMessage, statusCode } from '../constants';

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
export { _getProductName };
