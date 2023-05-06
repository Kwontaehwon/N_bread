import { util } from '../../src/modules';
import responseMessage from '../../src/modules/constants/responseMessage';
import statusCode from '../../src/modules/constants/statusCode';
import { logout } from '../../src/service/authService';
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
