import prisma from '../prisma';

const createDealReport = async (
  title: string,
  content: string,
  reporterId: number,
  dealId: number,
) => {
  return await prisma.dealReports.create({
    data: {
      title: title,
      content: content,
      reporterId: reporterId,
      dealId: dealId,
    },
  });
};

export { createDealReport };
