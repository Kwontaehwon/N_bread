import { responseMessage, statusCode } from '../modules/constants';
import { errorGenerator } from '../modules/error/errorGenerator';
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

const findCommentById = async (commentId: number) => {
  const comment = await prisma.comments.findFirst({
    where: {
      id: commentId,
    },
  });
  if (comment === null) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.COMMENT_NOT_FOUND,
    });
  }
  return comment;
};

const deleteComment = async (commentId: number) => {
  return await prisma.comments.delete({
    where: {
      id: commentId,
    },
  });
};

const updateComment = async (commentId: number, content: string) => {
  return await prisma.comments.update({
    where: { id: commentId },
    data: {
      content: content,
    },
  });
};

const createReply = async (
  userId: number,
  dealId: number,
  content: string,
  parentId: number,
) => {
  return prisma.replies.create({
    data: {
      userId: userId,
      dealId: dealId,
      content: content,
      parentId: parentId,
    },
  });
};

const findReplyById = async (replyId: number) => {
  const reply = await prisma.replies.findFirst({
    where: { id: replyId },
  });
  if (reply === null) {
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.REPLY_NOT_FOUND,
    });
  }
  return reply;
};

const deleteReply = async (replyId: number) => {
  await prisma.replies.delete({
    where: { id: replyId },
  });
};

const updateReply = async (replyId: number, content: string) => {
  await prisma.replies.update({
    where: { id: replyId },
    data: { content: content },
  });
};

const findCommentsWithReplies = async (dealId: number) => {
  return await prisma.comments.findMany({
    where: { dealId: dealId },
    include: {
      users: { select: { nick: true, userStatus: true } },
      replies: {
        include: { users: { select: { nick: true, userStatus: true } } },
      },
    },
  });
};

export {
  createComment,
  findCommentById,
  deleteComment,
  updateComment,
  createReply,
  findReplyById,
  deleteReply,
  updateReply,
  findCommentsWithReplies,
};
