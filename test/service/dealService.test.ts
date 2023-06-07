import prisma from '../../src/prisma';
import { dealRepository } from '../../src/repository/index';
import { dealService } from '../../src/service/index';

describe('거래 삭제 : deleteDeal', () => {
  const mockDeal = {
    id: 1,
    loc3: '역삼동',
    mystatus: null,
    title: '광동 비타 500',
    link: '',
    totalPrice: 32000,
    personalPrice: 16000,
    currentMember: 1,
    totalMember: 2,
    dealDate: new Date('2022-11-18 12:00'),
    dealPlace: '서울대입구역',
    content: '1+1 레깅스 같이사실분!! 색깔이랑 옵션은 채팅으로 논의해요~',
    status: '모집중',
    loc1: null,
    loc2: null,
    isCertificated: false,
    createdAt: new Date('2022-11-18 12:00'),
    updatedAt: new Date('2022-11-18 12:00'),
    deletedAt: null,
    userId: 1,
  };

  test('작성자가 아닌 사람이 삭제를 요청 했을 경우', async () => {
    const req: any = {
      query: { userId: '2' },
      params: { dealId: '1' },
    };

    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    dealRepository.findDealById = jest.fn().mockResolvedValue(mockDeal);
    await dealService.deleteDeal(req, res, next);
    expect(res.status).toBeCalledWith(401);
  });

  test('거래에 참여자가 이미 있는 경우', async () => {
    const req: any = {
      query: { userId: 1 },
      params: { dealId: 1 },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    const writerGroup = {
      id: 1,
      dealId: 1,
      userId: 1,
      amount: 1,
      createdAt: new Date('2022-11-18 12:00'),
      deletedAt: null,
      updatedAt: new Date('2022-11-18 12:00'),
    };
    const participantGroup = {
      id: 2,
      dealId: 1,
      userId: 2,
      amount: 1,
      createdAt: new Date('2022-11-18 12:00'),
      deletedAt: null,
      updatedAt: new Date('2022-11-18 12:00'),
    };

    // prismaMock.groups.findMany.mockResolvedValue([
    //   writerGroup,
    //   participantGroup,
    // ]);

    prisma.groups.findMany = jest
      .fn()
      .mockResolvedValue([writerGroup, participantGroup]);

    await dealService.deleteDeal(req, res, next);
    expect(res.status).toBeCalledWith(401);
  });
});
