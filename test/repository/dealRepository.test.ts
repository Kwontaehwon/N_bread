// jest.mock('../src/database/models');
import { dealRepository } from '../../src/repository/index';
import { Deal } from '../../src/database/models/deal';
import { dealParam } from '../../src/dto/deal/dealParam';
import prisma from '../../src/prisma';
import {
  createDealInTransaction,
  dealTransction,
} from '../../src/repository/dealRepository';

const dealParam: dealParam = {
  title: '광동 비타 500',
  link: '',
  totalPrice: 32000,
  personalPrice: 16000,
  currentMember: 1,
  totalMember: 2,
  dealDate: new Date('2022-11-18 12:00'),
  place: '서울대입구역',
  content: '1+1 레깅스 같이사실분!! 색깔이랑 옵션은 채팅으로 논의해요~',
};

const mockedUser = {
  id: 1,
  nick: '닉네임',
  email: 'kygkth2011@gmail.com',
  password: '1234',
  provider: 'Naver',
  snsId: 'snsId',
  accessToken: 'AccessToken',
  refreshToken: 'RefreshToken',
  userStatus: '모집중',
  curLocation1: '경기도',
  curLocation2: '안산시',
  curLocation3: '상록구',
  curLocationA: '경기도',
  curLocationB: '안산시',
  curLocationC: '상록구',
  isNewUser: false,
  kakaoNumber: '1234',
  createdAt: new Date('2022-11-18 12:00'),
  deletedAt: new Date('2022-11-18 12:00'),
  updatedAt: new Date('2022-11-18 12:00'),
};

describe('createDeal : 거래 생성', () => {
  test('거래 생성', async () => {
    const user = mockedUser;

    const mockDeal = {
      id: 'mock-deal-id',
      title: '광동 비타 500',
      link: '',
      totalPrice: 32000,
      personalPrice: 16000,
      currentMember: 1,
      totalMember: 2,
      dealDate: new Date('2022-11-18 12:00'),
      dealPlace: '서울대입구역',
      content: '1+1 레깅스 같이사실분!! 색깔이랑 옵션은 채팅으로 논의해요~',
      userId: mockedUser.id,
      loc1: mockedUser.curLocation1,
      loc2: mockedUser.curLocation2,
      loc3: mockedUser.curLocation3,
    };

    // Deal.create.mockReturnValue(Promise.resolve(mockDeal));
    const createdDeal: Deal = await dealRepository.createDealInTransaction(
      dealParam,
      mockedUser,
      prisma,
    );

    expect(createdDeal.link).toBe(dealParam.link);
    expect(createdDeal.title).toBe(dealParam.title);
    expect(createdDeal.content).toBe(dealParam.content);
    expect(createdDeal.totalPrice).toBe(+dealParam.totalPrice);
    expect(createdDeal.personalPrice).toBe(+dealParam.personalPrice);
    expect(createdDeal.totalMember).toBe(+dealParam.totalMember);
    expect(createdDeal.dealDate).toEqual(new Date(dealParam.dealDate));
    expect(createdDeal.dealPlace).toBe(dealParam.place);
    expect(createdDeal.currentMember).toBe(1);
    expect(createdDeal.userId).toBe(mockedUser.id);
    expect(createdDeal.loc1).toBe(mockedUser.curLocation1);
    expect(createdDeal.loc2).toBe(mockedUser.curLocation2);
    expect(createdDeal.loc3).toBe(mockedUser.curLocation3);
    expect(createdDeal).toHaveProperty('id');
  });
});

describe('deleteDeal : 거래 삭제', () => {
  test('거래 삭제 soft Delete', async () => {
    const deal = await dealRepository.createDealInTransaction(
      dealParam,
      mockedUser,
      prisma,
    );
    await prisma.deals.delete({
      where: { id: deal.id },
    });
    expect(deal.deletedAt).toBeDefined();
  });
});

describe('dealTransaction : 거래 생성 Transaction', () => {
  it('Transaction Commit', async () => {
    const exGroupCount = await prisma.groups.count();
    const exDealCount = await prisma.deals.count();

    await dealRepository.dealTransction(dealParam, 1);

    const curGroupCount = await prisma.groups.count();
    const curDealCount = await prisma.deals.count();
    expect(exGroupCount + 1).toEqual(curGroupCount);
    expect(exDealCount + 1).toEqual(curDealCount);
  });
  it('Transaction Rollback', async () => {
    jest.mock('../../src/repository/dealRepository');
    const exGroupCount = await prisma.groups.count();
    const exDealCount = await prisma.deals.count();
    const createDealMock = jest.spyOn(
      dealRepository,
      'createDealInTransaction',
    );
    createDealMock.mockRejectedValue(new Error('TEST'));
    try {
      const deal = await dealRepository.dealTransction(dealParam, 1);
      console.log(deal);
    } catch (error) {
      const curGroupCount = await prisma.groups.count();
      const curDealCount = await prisma.deals.count();
      createDealMock.mockReset();
      expect(exGroupCount).toEqual(curGroupCount);
      expect(exDealCount).toEqual(curDealCount);
    }
  });
  it('Transaction Commit Again', async () => {
    const exGroupCount = await prisma.groups.count();
    const exDealCount = await prisma.deals.count();

    await dealRepository.dealTransction(dealParam, 1);

    const curGroupCount = await prisma.groups.count();
    const curDealCount = await prisma.deals.count();
    expect(exGroupCount + 1).toEqual(curGroupCount);
    expect(exDealCount + 1).toEqual(curDealCount);
  });
});
