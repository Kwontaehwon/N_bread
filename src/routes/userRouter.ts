import express, { Express, Request, Response, Router } from 'express';
import { verifyToken } from '../middlewares/middleware';
import { userService } from '../service';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';
const userRouter: Router = Router();

userRouter.use(express.json());

userRouter.get(
  '/deals/:userId',
  verifyToken,
  [param('userId').isNumeric()],
  errorValidator,
  userService.getMypageDeals,
);

userRouter.post(
  '/location/:userId/:latitude/:longitude',
  [
    param('userId').isNumeric(),
    param('latitude').notEmpty(),
    param('longitude').notEmpty(),
  ],
  userService.saveLocationByCoordinate,
);

// 유저 DB에서 저장된 위치 GET -> verifyToken 삭제?
userRouter.get('/location', verifyToken, userService.getUserLocation);

// 유저 정보 GET
userRouter.get('/:userId', userService.getUser);

// 유저 닉네임 변경
userRouter.put('/:userId', userService.changeUserNick);

//유저 닉네임 중복체크
userRouter.get('/check/:userId/:nick', userService.checkUserNick); // 닉네임 중복체크를 하는데 userId가 필요한 이유는?

// 유저 신고
userRouter.post('/report/:userId', verifyToken, userService.postReportUser);

//회원가입 완료 여부
userRouter.get('/check/:userId', userService.isSetNickname);

//reverse geocoding을 통해 위치 가져오기
userRouter.get(
  '/location/:latitude/:longitude',
  userService.getLocationByNaverMapsApi,
);

//reverse geocoding을 통해 가져온 위치 db에 저장
userRouter.post(
  '/location/:userId/:loc1/:loc2/:loc3',
  userService.setLocationByNaverMapsApi,
);

//위치를 인자로 받아 동을 지워주는 api
userRouter.delete('/location/:dong', verifyToken, userService.deletelocation);

//위치를 body로 받아 curLocation ABC를 채워주는 api
userRouter.post('/location', verifyToken, userService.addLocation);

export { userRouter };
