import { getUser, changeUserNick } from '../../src/service/userService';
import { User } from '../../src/database/models/user';
import { responseMessage, statusCode } from '../../src/modules/constants';
import * as util from '../../src/modules/util';
import {
  errorGenerator,
  ErrorWithStatusCode,
} from '../../src/modules/error/errorGenerator';
import { userRepository } from '../../src/repository';
describe('[userService] changeUserNick 테스트', () => {
  const expectedNickName = 'newNick';
  const req = {
    body: { nick: expectedNickName },
    params: { userId: 1 },
  };

  const next = jest.fn();
  const res = jest.fn();
  const expectedResult = {
    userId: 1,
    nick: expectedNickName,
  };

  (util.success as any) = jest.fn();
  const success = util.success;
  test('닉네임 변환 여부 테스트(정상 작동)', async () => {
    userRepository.changeUserNick = jest.fn().mockReturnValue(expectedResult);
    await changeUserNick(req, res, next);
    expect(success).toBeCalledWith(
      res,
      statusCode.OK,
      responseMessage.SUCCESS,
      expectedResult,
    );
  });

  test('유저가 존재하지 않을 때', async () => {
    userRepository.findUserById = jest.fn().mockImplementation(() => {
      throw errorGenerator({
        message: responseMessage.USER_NOT_FOUND,
        code: statusCode.NOT_FOUND,
      });
    });
    await changeUserNick(req, res, next);
    const error: ErrorWithStatusCode = new Error(
      responseMessage.USER_NOT_FOUND,
    );
    expect(next).toBeCalledWith(error);
  });

  test('중복된 닉네임으로 변경 시도', async () => {
    (util.fail as any) = jest.fn();
    const fail = util.fail;
    userRepository.findUserById = jest.fn().mockReturnValue({});
    userRepository.isNicknameExist = jest.fn().mockReturnValue(true);
    await changeUserNick(req, res, next);
    expect(fail).toBeCalledWith(
      res,
      statusCode.BAD_REQUEST,
      responseMessage.NICKNAME_DUPLICATED,
    );
  });
});
