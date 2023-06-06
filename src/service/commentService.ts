import { NextFunction, Request, Response } from 'express';
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
import { success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';
import { CommentDto } from '../dto/commentDto';

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
      await fcmHandler.sendMulticast(userId, fcmNotification, fcmData);
    }

    const commentDto: CommentDto = new CommentDto(comment);
    success(res, statusCode.OK, responseMessage.SUCCESS, commentDto);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export { createComment };
