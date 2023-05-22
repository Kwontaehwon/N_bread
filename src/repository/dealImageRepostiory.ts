import prisma from '../prisma';

const createDealImage = async (url: string, dealId: number) => {
  return await prisma.dealImages.create({
    data: {
      dealImage: url,
      dealId: dealId,
    },
  });
};

export { createDealImage };
