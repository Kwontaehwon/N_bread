import express from 'express';

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const sequelize = require('sequelize');

import { verifyToken } from '../middlewares/middleware';
import { User, Group, Deal, Comment, Reply } from '../database/models';

import { Op } from 'sequelize';
import { logger } from '../config/winston';
import admin from 'firebase-admin';
import { util } from '../modules/';
import { body, param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
import { commentService } from '../service';
const commentRouter = express.Router();

commentRouter.use(express.json());

// #swagger.summary = '댓글 생성'
commentRouter.post(
  '/:dealId',
  param('dealId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.createComment,
);

// #swagger.summary = '댓글 수정'
commentRouter.put(
  '/:commentId',
  param('commentId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.updateComment,
);

// #swagger.summary = '댓글 삭제'
commentRouter.delete(
  '/:commentId',
  param('commentId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.deleteComment,
);

// #swagger.summary = '대댓글 생성'
commentRouter.post(
  '/reply/:dealId',
  param('dealId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.createReply,
);

// #swagger.summary = '대댓글 삭제'
commentRouter.delete(
  '/reply/:replyId',
  param('replyId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.deleteReply,
);

commentRouter.put(
  '/reply/:replyId',
  param('replyId').isNumeric(),
  errorValidator,
  verifyToken,
  commentService.updateReply,
);

// #swagger.summary = '거래글 댓글 조회'
commentRouter.get(
  '/:dealId',
  param('dealId').isNumeric(),
  commentService.readComments,
);

export { commentRouter };
