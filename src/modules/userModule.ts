import { mypageDto } from '../dto/deal/mypageDto';

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
export { _setDealStatus, _setUserStatus };
