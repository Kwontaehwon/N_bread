import express, { Router } from 'express';
import { authRouter } from './authRouter';
import { dealRouter } from './dealRouter';
import { userRouter } from './userRouter';
import { commentRouter } from './commentRouter';
import { eventRouter } from './eventRouter';
import { priceRouter } from './priceRouter';
import { responseMessage, statusCode } from '../modules/constants';
import { success } from '../modules/util';
const router: Router = express.Router();

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
router.get('/', async (req, res, next) => {
  try {
    success(res, statusCode.OK, responseMessage.SUCCESS, 'Server Connected');
  } catch (err) {
    console.error(err);
    next(err);
  }
});
export { router };
