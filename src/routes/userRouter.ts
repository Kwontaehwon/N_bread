import express, { Router } from 'express';
import { verifyToken } from '../middlewares/middleware';
import { userService } from '../service';
import { body, param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
const userRouter: Router = Router();

userRouter.use(express.json());

/**마이페이지 거래 내역 GET */
userRouter.get(
  '/deals/:userId',
  verifyToken,
  [param('userId').isNumeric()],
  errorValidator,
  userService.getMypageDeals,
);

/**좌표 기반 위치 POST */
userRouter.post(
  '/location/:userId/:latitude/:longitude',
  [
    param('userId').isNumeric(),
    param('latitude').notEmpty(),
    param('longitude').notEmpty(),
  ],
  errorValidator,
  userService.saveLocationByCoordinate,
);

/**유저 DB에서 저장된 위치 GET*/
userRouter.get('/location', verifyToken, userService.getUserLocation);

/**유저 정보 GET*/
userRouter.get(
  '/:userId',
  [param('userId').isNumeric()],
  errorValidator,
  userService.getUser,
);

/**유저 닉네임 PUT*/
userRouter.put(
  '/:userId',
  [param('userId').isNumeric()],
  errorValidator,
  userService.changeUserNick,
);

/**유저 닉네임 중복체크 GET*/
userRouter.get(
  '/check/:userId/:nick',
  [param('userId').isNumeric(), param('nick').notEmpty()],
  errorValidator,
  userService.checkUserNick,
);

/**유저 신고 POST*/
userRouter.post(
  '/report/:userId',
  [
    param('userId').isNumeric(),
    body('title').notEmpty(),
    body('content').notEmpty(),
  ],
  errorValidator,
  verifyToken,
  userService.postReportUser,
);

export { userRouter };
