import { PrismaClient, deals } from '@prisma/client';
import {
  dealRepository,
  groupRepository,
  userRepository,
} from '../../src/repository/index';
import { dealParam } from '../../src/dto/deal/dealParam';
import prisma from '../../src/prisma';
const prismaForHardDelete = new PrismaClient();

const testDealParam: dealParam = {
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

let mockedUser;

beforeAll(async () => {
  mockedUser = await prisma.users.create({
    data: {
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
    },
  });
});

afterAll(async () => {
  await prismaForHardDelete.users.delete({
    where: {
      id: mockedUser.id,
    },
  });
});

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
    const createdDeal: deals = await dealRepository.createDealInTransaction(
      testDealParam,
      mockedUser,
      prisma,
    );

    expect(createdDeal.link).toBe(testDealParam.link);
    expect(createdDeal.title).toBe(testDealParam.title);
    expect(createdDeal.content).toBe(testDealParam.content);
    expect(createdDeal.totalPrice).toBe(+testDealParam.totalPrice);
    expect(createdDeal.personalPrice).toBe(+testDealParam.personalPrice);
    expect(createdDeal.totalMember).toBe(+testDealParam.totalMember);
    expect(createdDeal.dealDate).toEqual(new Date(testDealParam.dealDate));
    expect(createdDeal.dealPlace).toBe(testDealParam.place);
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
      testDealParam,
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

    userRepository.findUserById = jest.fn().mockResolvedValue(mockedUser);
    groupRepository.createGroupInTransaction;
    dealRepository.createDealInTransaction;
    groupRepository.updateDealIdInTransaction;

    await dealRepository.dealTransction(testDealParam, 1);

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
      const deal = await dealRepository.dealTransction(testDealParam, 1);
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

    await dealRepository.dealTransction(testDealParam, 1);

    const curGroupCount = await prisma.groups.count();
    const curDealCount = await prisma.deals.count();
    expect(exGroupCount + 1).toEqual(curGroupCount);
    expect(exDealCount + 1).toEqual(curDealCount);
  });
});
