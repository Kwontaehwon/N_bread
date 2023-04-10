const express = require('express');
const { User } = require('../database/models');
const { verifyToken } = require('../middlewares/middleware');
const { authRouter } = require('./authRouter');
const { dealRouter } = require('./dealRouter');
const { userRouter } = require('./userRouter');
const { commentRouter } = require('./commentRouter');
const { eventRouter } = require('./eventRouter');
const { priceRouter } = require('./priceRouter');
const { util } = require('../modules/');
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
