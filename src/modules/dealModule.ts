import { dealParam } from '../dto/deal/dealParam';
import { responseMessage, statusCode } from './constants';
import { fail } from '../modules/util';
import { errorGenerator } from './error/errorGenerator';

const _verifyDealDate = async (res, param: dealParam) => {
  const dealDate = new Date(param.dealDate);
  console.log('DEAL DATE : ' + dealDate.getTime());
  const expireDate = dealDate.getTime();
  if (expireDate < Date.now()) {
    throw errorGenerator({
      message: responseMessage.DEAL_DATE_VALIDATION_ERROR,
      code: statusCode.BAD_REQUEST,
    });
  }
};

export { _verifyDealDate };
