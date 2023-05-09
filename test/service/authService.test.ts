import { util } from '../../src/modules';
import responseMessage from '../../src/modules/constants/responseMessage';
import statusCode from '../../src/modules/constants/statusCode';
import { userRepository } from '../../src/repository';
import { localSignUp, logout } from '../../src/service/authService';
describe('[authService] logout 테스트', () => {
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };
  const req: any = {
    logout: jest.fn(() => {
      req.session.destroy();
    }),
    session: {
      destroy: jest.fn().mockImplementation(() => {
        success(res, statusCode.OK, responseMessage.SUCCESS, {});
      }),
    },
  };

  (util.success as any) = jest.fn();
  const success = util.success;
  test('로그아웃 테스트', async () => {
    await logout(req, res);
    expect(success).toBeCalledWith(
      res,
      statusCode.OK,
      responseMessage.SUCCESS,
      {},
    );
  });
});

describe('[authService] localSignUp 테스트', () => {
  const req: any = {
    body: {
      email: 'test@test.com',
      nick: 'testNickname',
      password: 'testPassword',
    },
  };
  const res: any = {
    send: jest.fn(),
    status: jest.fn(() => res),
  };

  test('닉네임 중복 시 로컬 회원가입', async () => {
    userRepository.isEmailExist = jest.fn().mockReturnValue(true);
    await localSignUp(req, res);
    expect(res.status).toBeCalledWith(statusCode.BAD_REQUEST);
    const fail_result = {
      code: statusCode.BAD_REQUEST,
      success: false,
      message: responseMessage.EMAIL_DUPLICATED,
    };
    expect(res.send).toBeCalledWith(fail_result);
  });
});
