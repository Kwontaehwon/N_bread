import prisma from '../../src/prisma';
import { PrismaClient } from '@prisma/client';
import {
  findUserById,
  isNicknameExist,
} from '../../src/repository/userRepository';
import { statusCode } from '../../src/modules/constants';
const prismaForHardDelete = new PrismaClient();
describe('find user by id', () => {
  const user = {
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
  };
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
      await findUserById(1000);
    } catch (e) {
      expect(e).toHaveProperty('statusCode', statusCode.NOT_FOUND);
    }
  });
});

describe('isNicknameExist test', () => {
  const user = {
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
  };
  test('중복된 닉네임이 없을 때', async () => {
    await expect(isNicknameExist('없는 닉네임')).resolves.toEqual(false);
  });

  test('중복된 닉네임일 경우', async () => {
    const createData = await prisma.users.create({ data: user });
    await expect(isNicknameExist('테스트유저')).resolves.toEqual(true);
    await prismaForHardDelete.users.delete({
      where: { id: createData.id },
    });
  });
});
