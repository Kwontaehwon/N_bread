import prisma from '../../src/prisma';
import { PrismaClient } from '@prisma/client';
import {
  changeUserNick,
  createUser,
  findUserByEmail,
  findUserById,
  isEmailExist,
  isNicknameExist,
} from '../../src/repository/userRepository';
import { responseMessage, statusCode } from '../../src/modules/constants';
import { error } from 'console';
const prismaForHardDelete = new PrismaClient();

const createUserEmail = 'testUser@gmail.com';
const createUserNick = '테스트유저';
const user = {
  email: createUserEmail,
  nick: createUserNick,
  password: 'test',
  provider: 'local',
  snsId: null,
  accessToken: null,
  curLocation1: 'test1',
  curLocation2: 'test2',
  curLocation3: 'test3',
  curLocationA: null,
  curLocationB: null,
  curLocationC: null,
  userStatus: null,
  refreshToken: null,
  isNewUser: true,
  kakaoNumber: null,
  createdAt: new Date(Date.parse('2022-05-04T12:47:04.000Z')),
  updatedAt: new Date(Date.parse('2022-05-04T12:47:04.000Z')),
  deletedAt: null,
};
describe('find user by id', () => {
  test('find user ', async () => {
    const createData = await prisma.users.create({ data: user });
    await expect(findUserById(+createData.id)).resolves.toEqual({
      id: createData.id,
      email: 'testUser@gmail.com',
      nick: '테스트유저',
      password: 'test',
      provider: 'local',
      snsId: null,
      accessToken: null,
      curLocation1: 'test1',
      curLocation2: 'test2',
      curLocation3: 'test3',
      curLocationA: null,
      curLocationB: null,
      curLocationC: null,
      userStatus: null,
      refreshToken: null,
      isNewUser: true,
      kakaoNumber: null,
      createdAt: new Date(Date.parse('2022-05-04T12:47:04.000Z')),
      updatedAt: new Date(Date.parse('2022-05-04T12:47:04.000Z')),
      deletedAt: null,
    });
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });
  test('when user is not exist', async () => {
    try {
      const lastUser = await prisma.users.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });
      await findUserById(lastUser[0].id + 1);
    } catch (error) {
      expect(error).toHaveProperty('name', 'NotFoundError');
    }
  });
});

describe('isNicknameExist test', () => {
  test('중복된 닉네임이 없을 때', async () => {
    await expect(isNicknameExist('없는 닉네임')).resolves.toEqual(false);
  });

  test('중복된 닉네임일 경우', async () => {
    const createData = await prisma.users.create({ data: user });
    await expect(isNicknameExist(createUserNick)).resolves.toEqual(true);
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });
});

describe('isEmailExist test', () => {
  test('중복된 이메일이 없을 때', async () => {
    await expect(isEmailExist('없는 이메일')).resolves.toEqual(false);
  });

  test('중복된 이메일일 경우', async () => {
    const createData = await prisma.users.create({ data: user });
    await expect(isEmailExist(createUserEmail)).resolves.toEqual(true);
    console.log(createData.id);
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });
});

describe('changeNick', () => {
  const newNickname = '바꾸려는 닉네임';
  test('닉네임 변경 테스트', async () => {
    const createData = await prisma.users.create({ data: user });
    await expect(changeUserNick(createData.id, newNickname)).resolves.toEqual({
      userId: createData.id,
      nick: newNickname,
    });
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });

  test('닉네임 변경 시 prismaError테스트', async () => {
    try {
      prisma.users.update = jest.fn().mockImplementation(() => {
        throw error;
      });
      await changeUserNick(1, newNickname);
    } catch (error) {
      expect(error.message).toBe(responseMessage.NICKNAME_CHANGE_FAIL);
      expect(error).toHaveProperty('statusCode', statusCode.BAD_REQUEST);
    }
  });
});

describe('[userRepository] CreateUser 테스트', () => {
  const userEmail = 'test@testtest.com';
  const userNick = 'testtestNick';
  const userPassword = '123123123';
  test('유저 생성 정상작동 테스트', async () => {
    expect(
      createUser(userEmail, userNick, userPassword),
    ).resolves.toHaveProperty('nickName', userNick);
    const user = await prisma.users.findFirst({
      where: { nick: userNick },
    });
    await prismaForHardDelete.users.delete({ where: { id: user!.id } });
  });
  test('유저 생성 시 prisma 오류 테스트', async () => {
    prisma.users.create = jest.fn(() => {
      throw error;
    });
    try {
      await createUser(userEmail, userNick, userPassword);
    } catch (error) {
      expect(error.message).toEqual(responseMessage.CREATE_USER_FAILED);
      expect(error).toHaveProperty('statusCode', statusCode.BAD_REQUEST);
    }
  });
});

describe('[userRepository] FindUserByEmail 테스트', () => {
  test('findUserByEmail 정상 작동 테스트', async () => {
    const createData = await prisma.users.create({ data: user });
    expect(findUserByEmail(createUserEmail)).resolves.toHaveProperty(
      'email',
      createUserEmail,
    );
    expect(findUserByEmail(createUserEmail)).resolves.toHaveProperty(
      'nick',
      createUserNick,
    );
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });
});
