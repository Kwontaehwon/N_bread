import prisma from '../prisma';

const createDealImage = async (url: string, dealId: number) => {
  return await prisma.dealImages.create({
    data: {
      dealImage: url,
      dealId: dealId,
    },
  });
};

/**dealId기반 거래 이미지 조회, 거래 이미지 없어도 에러 x */
const findDealImageById = async (dealId: number) => {
  return await prisma.dealImages.findFirst({
    where: { dealId },
  });
};

export { createDealImage, findDealImageById };
