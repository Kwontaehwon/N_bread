import { priceDto } from '../dto/price/priceDto';
import prisma from '../prisma';

const isPriceExist = async (dealId: number) => {
  const price = await prisma.prices.findFirst({ where: { dealId } });
  return !!price;
};

const savePriceInfo = async (priceDto: priceDto) => {
  await prisma.prices.create({ data: priceDto });
};
export { isPriceExist, savePriceInfo };
