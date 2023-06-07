import express, { Router } from 'express';
import { verifyToken } from '../middlewares/middleware';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
import { commentService } from '../service';
const commentRouter: Router = express.Router();

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
