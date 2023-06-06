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

commentRouter.put('/reply/:replyId', verifyToken, async (req, res) => {
  // #swagger.summary = '대댓글 수정'
  try {
    const user = await User.findOne({ where: { id: req.decoded.id } });
    const reply = await Reply.findOne({
      where: { id: parseInt(req.params.replyId) },
    });
    if (reply === null) {
      util.jsonResponse(res, 404, '답글이 존재하지 않습니다.', false, {});
      res.end();
    } else {
      if (reply.userId === user.id) {
        await reply.update({
          content: req.body.content,
        });
        util.jsonResponse(res, 200, '답글 수정이 완료되었습니다.', false, {});
      } else {
        util.jsonResponse(
          res,
          403,
          '작성자만 답글을 수정할 수 있습니다.',
          false,
          {},
        );
      }
    }
  } catch (error) {
    logger.error('[대댓글 생성] POST /comments/reply/:dealId 서버 에러');
    util.jsonResponse(
      res,
      500,
      '[대댓글 생성] POST /comments/reply/:dealId 서버 에러',
      false,
      {},
    );
  }
});
commentRouter.get('/:dealId', async (req, res) => {
  // #swagger.summary = '거래글 댓글 조회'
  try {
    const suggest = await Deal.findOne({
      where: { id: req.params.dealId },
      attributes: ['id', 'userId'],
    });
    const group = await Group.findAll({
      where: { dealId: req.params.dealId },
      attributes: ['dealId', 'userId'],
    });

    const comments = await Comment.findAll({
      where: { dealId: req.params.dealId },
      paranoid: false,
      include: [
        {
          model: User,
          attributes: ['nick', 'userStatus'],
          paranoid: false,
        },
        {
          model: Reply,
          paranoid: false,
          required: false,
          where: { dealId: req.params.dealId },
          include: {
            model: User,
            attributes: ['nick', 'userStatus'],
            paranoid: false,
          },
        },
      ],
    });
    //userStatus처리
    const suggester = suggest['userId'];
    var groupMember = [];
    for (let i = 0; i < group.length; i++) {
      groupMember.push(group[i]['userId']);
      console.log(group[i]['userId']);
    }
    //console.log(comments[0]['dataValues']);
    //comment userStatus처리
    for (let i = 0; i < comments.length; i++) {
      //deleted comment 처리
      if (comments[i]['deletedAt'] != null) {
        comments[i]['content'] = '삭제된 댓글입니다.';
      }

      // comments UserStatus
      if (comments[i]['userId'] === suggester) {
        comments[i]['User']['userStatus'] = '제안자';
      } else if (groupMember.includes(comments[i]['userId'])) {
        comments[i]['User']['userStatus'] = '참여자';
      } else {
        comments[i]['User']['userStatus'] = '';
      }

      //reply UserStauts
      for (let j = 0; j < comments[i]['Replies'].length; j++) {
        var curReply = comments[i]['Replies'][j];
        if (curReply['deletedAt'] != null) {
          curReply['content'] = '삭제된 댓글입니다.';
        }

        if (curReply['userId'] == suggester) {
          curReply['User']['userStatus'] = '제안자';
        } else if (groupMember.includes(curReply['userId'])) {
          curReply['User']['userStatus'] = '참여자';
        } else {
          curReply['User']['userStatus'] = '';
        }
      }
    }
    const result = { suggest: suggest, group: group, comments: comments };
    util.jsonResponse(res, 200, 'get comments', true, result);
  } catch (error) {
    logger.error('[거래 댓글 조회] GET /comments/:dealId');
    util.jsonResponse(
      res,
      500,
      '[거래 댓글 조회] GET /comments/:dealId',
      false,
      {},
    );
  }
});

export { commentRouter };
