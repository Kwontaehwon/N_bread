import { getUser, changeUserNick } from '../../src/service/userService';
import { User } from '../../src/database/models/user';
import { responseMessage, statusCode } from '../../src/modules/constants';
import * as util from '../../src/modules/util';
import {
  errorGenerator,
  ErrorWithStatusCode,
} from '../../src/modules/error/errorGenerator';
import { userRepository } from '../../src/repository';

describe('getUser', () => {
  const req = {
    params: { userId: +1 },
  };
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();

  test('유저를 찾아 반환', async () => {
    const queryResult = {
      createdAt: '2022-07-30 22:00',
      nick: 'Test Nick',
      provider: 'local',
      curLocation3: '역삼동',
    };
    const expectedResult = {
      createdAt: '2022-07-30 22:00',
      nick: 'Test Nick',
      provider: 'local',
      addr: '역삼동',
    };
    User.findOne.mockReturnValue(Promise.resolve(queryResult));
    await getUser(req, res, next);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({
      code: 200,
      message: 'userId의 정보를 반환합니다.',
      isSuccess: true,
      result: expectedResult,
    });
  });

  test('해당되는 유저 없음 (null)', async () => {
    User.findOne.mockReturnValue(null);
    await getUser(req, res, next);
    expect(res.status).toBeCalledWith(404);
  });
});

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
      200,
      responseMessage.NICKNAME_CHANGE_SUCCESS,
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
    userRepository.findUserById = jest.fn().mockReturnValue({});
    userRepository.isNicknameExist = jest.fn().mockImplementation(() => {
      throw errorGenerator({
        message: responseMessage.NICKNAME_DUPLICATED,
        code: statusCode.BAD_REQUEST,
      });
    });
    await changeUserNick(req, res, next);
    const error: ErrorWithStatusCode = new Error(
      responseMessage.NICKNAME_DUPLICATED,
    );
    expect(next).toBeCalledWith(error);
  });
});