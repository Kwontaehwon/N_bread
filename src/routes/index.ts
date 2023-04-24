const express = require('express');
import { User } from '../database/models';
import { verifyToken } from '../middlewares/middleware';
import { authRouter } from './authRouter';
import { dealRouter } from './dealRouter';
import { userRouter } from './userRouter';
import { commentRouter } from './commentRouter';
import { eventRouter } from './eventRouter';
import { priceRouter } from './priceRouter';
import { util } from '../modules/';
const router = express.Router();

router.use(
  '/auth',
  // #swagger.tags = ['Auth']
  authRouter,
);
router.use(
  // #swagger.tags = ['Deals']
  '/deals',
  dealRouter,
);
router.use(
  // #swagger.tags = ['Users']
  '/users',
  userRouter,
);
router.use(
  '/comments',
  // #swagger.tags = ['Comments']
  commentRouter,
);
router.use(
  '/events',
  // #swagger.tags = ['Events']
  eventRouter,
);
router.use(
  '/price',
  // #swagger.tags = ['Slack']
  priceRouter,
);
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.decoded.id || null },
    });
    req.session.loginData = user;
    return util.jsonResponse(
      res,
      200,
      `USER : ${req.session.loginData}`,
      true,
      req.session.loginData,
    );
  } catch (err) {
    console.error(err);
    next(err);
  }
});
export { router };
