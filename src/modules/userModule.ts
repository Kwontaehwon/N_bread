import axios from 'axios';
import { mypageDto } from '../dto/deal/mypageDto';
import config from '../config';
import { errorGenerator } from './error/errorGenerator';
import { responseMessage, statusCode } from './constants';

const _setDealStatus = (dataObject: mypageDto) => {
  let dDate = new Date(dataObject['dealDate']);
  dDate.setHours(dDate.getHours() + 9);
  dataObject['dealDate'] = dDate;
  dataObject['mystatus'] = 'user';

  if (dataObject['dealDate'] < new Date(Date.now())) {
    if (dataObject['currentMember'] === dataObject['totalMember'])
      dataObject['status'] = '거래완료';
    else dataObject['status'] = '모집실패';
  } else {
    if (dataObject['currentMember'] === dataObject['totalMember'])
      dataObject['status'] = '모집완료';
    else dataObject['status'] = '모집중';
  }
};

const _setUserStatus = (dataObject: mypageDto, suggestedDealId: number[]) => {
  if (suggestedDealId.includes(dataObject['id'])) {
    dataObject['mystatus'] = '제안자';
  } else {
    dataObject['mystatus'] = '참여자';
  }
};

const _getLocationByCoordinate = (longitude: number, latitude: number) => {
  const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${longitude},${latitude}&sourcecrs=epsg:4326&orders=legalcode&output=json`;

  axios
    .get(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': config.naverClientId!,
        'X-NCP-APIGW-API-KEY': config.NaverClientSecret!,
      },
    })
    .then(async (Response) => {
      if (Response.data['status']['code'] === 200) {
        throw errorGenerator({
          code: statusCode.UNAUTHORIZED,
          message: responseMessage.NAVER_UNAUTHORIZED,
        });
      } else if (Response.data['status']['code'] === 100) {
        throw errorGenerator({
          code: statusCode.BAD_REQUEST,
          message: responseMessage.NAVER_INVALID_COORDINATE,
        });
      }
      return Response.data['results'][0]['region'];
    });
};
export { _setDealStatus, _setUserStatus, _getLocationByCoordinate };
