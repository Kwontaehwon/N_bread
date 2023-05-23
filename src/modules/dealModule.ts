import { dealParam } from '../dto/deal/dealParam';
import { responseMessage, statusCode } from './constants';
import { fail } from '../modules/util';
import { errorGenerator } from './error/errorGenerator';
import { groups } from '@prisma/client';
import { dealRepository } from '../repository';

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

const _checkUserStatusInDeal = async (
  group: groups,
  userId: number,
  dealId: number,
) => {
  let status, description;
  if (!group) {
    description = '참여하지 않음';
    status = 0;
  } else {
    const deal = await dealRepository.findDealById(dealId);
    if (deal.userId == userId) {
      //deal.userId는 number 형이고 req.params.userId는 string형 이므로 == 를 사용해야함.
      description = '제안자';
      status = 2;
    } else {
      description = '참여자';
      status = 1;
    }
  }
  return { status: status, description: description };
};

export { _verifyDealDate, _checkUserStatusInDeal };
