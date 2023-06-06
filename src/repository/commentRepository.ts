import prisma from '../prisma';

const createComment = async (
  userId: number,
  dealId: number,
  content: string,
) => {
  return prisma.comments.create({
    data: {
      userId: userId,
      dealId: dealId,
      content: content,
    },
  });
};

export { createComment };
