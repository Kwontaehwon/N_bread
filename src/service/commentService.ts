import { NextFunction, Request, Response, response } from 'express';
import { logger } from '../config/winston';
import {
  commentRepository,
  dealRepository,
  userRepository,
} from '../repository';
import {
  DataMessagePayload,
  Notification,
} from 'firebase-admin/lib/messaging/messaging-api';
import { fcmHandler } from '../modules';
import { fail, success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';
import { CommentDto } from '../dto/commentDto';
import { comments } from '@prisma/client';
import prisma from '../prisma';
import { ReplyDto } from '../dto/replyDto';

const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId: number = +req.query.userId;
    const dealId: number = +req.params.dealId;
    const content: string = req.body.content;
    const user = await userRepository.findUserById(userId);

    const comment = await commentRepository.createComment(
      userId,
      dealId,
      content,
    );
    const deal = await dealRepository.findDealById(dealId);
    if (deal.userId != user.id) {
      const fcmNotification: Notification = {
        title: 'N빵에 새로운 댓글이 달렸어요',
        body: content,
      };
      const fcmData: DataMessagePayload = {
        type: 'deal',
        dealId: `${dealId}`,
      };
      let fcmTokenList = [];
      await fcmHandler.getAndStoreTokenInList(fcmTokenList, userId);

      await fcmHandler.sendMulticast(fcmTokenList, fcmNotification, fcmData);
    }

    const commentDto: CommentDto = new CommentDto(comment);
    success(res, statusCode.CREATED, responseMessage.SUCCESS, commentDto);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId: number = +req.query.userId;
    const commentId: number = +req.params.commentId;

    const user = await userRepository.findUserById(userId);
    const comment: comments = await commentRepository.findCommentById(
      commentId,
    );
    if (comment.userId !== user.id) {
      fail(
        res,
        statusCode.UNAUTHORIZED,
        responseMessage.COMMENT_DELETE_NOT_AUTH,
      );
    }
    await commentRepository.deleteComment(commentId);
    success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = +req.query.userId;
    const commentId = +req.params.commentId;
    const content = req.body.content;

    const user = await userRepository.findUserById(userId);
    const comment = await commentRepository.findCommentById(commentId);

    if (comment.userId !== user.id) {
      fail(
        res,
        statusCode.UNAUTHORIZED,
        responseMessage.COMMENT_DELETE_NOT_AUTH,
      );
    }

    await commentRepository.updateComment(commentId, content);
    const updatedComment = await commentRepository.findCommentById(commentId);
    const commentDto: CommentDto = await new CommentDto(updatedComment);
    success(res, statusCode.OK, responseMessage.SUCCESS, commentDto);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = +req.query.userId;
    const dealId = +req.params.dealId;
    const content = req.body.content;
    const parentId = +req.body.parentId;

    const user = await userRepository.findUserById(userId);

    const parentComment = await commentRepository.findCommentById(parentId);

    const reply = await commentRepository.createReply(
      userId,
      dealId,
      content,
      parentId,
    );

    const repliesUserIdList = await prisma.replies.findMany({
      select: { userId: true },
      where: { parentId: parentId },
      distinct: ['userId'],
    });

    let fcmTokenList = [];
    if (parentComment.userId != userId)
      await fcmHandler.getAndStoreTokenInList(
        fcmTokenList,
        parentComment.userId,
      );
    for (let targetId of repliesUserIdList) {
      if (targetId.userId == user.id) continue;
      await fcmHandler.getAndStoreTokenInList(fcmTokenList, targetId.userId);
    }

    if (fcmTokenList.length > 0) {
      const fcmNotification: Notification = {
        title: 'N빵에 새로운 대댓글이 달렸어요',
        body: content,
      };
      const fcmData: DataMessagePayload = {
        type: 'deal',
        dealId: `${dealId}`,
      };
      await fcmHandler.sendMulticast(fcmTokenList, fcmNotification, fcmData);
    }

    const replyDto = new ReplyDto(reply);
    success(res, statusCode.OK, responseMessage.SUCCESS, replyDto);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export { createComment, deleteComment, updateComment, createReply };
