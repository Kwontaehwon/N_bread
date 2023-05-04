import prisma from '../../src/prisma';
import { PrismaClient } from '@prisma/client';
import {
  changeUserNick,
  findUserById,
  isNicknameExist,
} from '../../src/repository/userRepository';
import { statusCode } from '../../src/modules/constants';
const prismaForHardDelete = new PrismaClient();

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
      await findUserById(1000);
    } catch (error) {
      expect(error).toHaveProperty('statusCode', statusCode.NOT_FOUND);
    }
  });
});

describe('isNicknameExist test', () => {
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

  test(`${newNickname}으로 닉네임 변경 재시도 테스트`, async () => {
    const createData = await prisma.users.create({ data: user });
    await changeUserNick(createData.id, newNickname);
    try {
      await changeUserNick(createData.id, newNickname);
    } catch (error) {
      await prismaForHardDelete.users.delete({
        where: { id: createData.id },
      });
      expect(error).toHaveProperty('statusCode', statusCode.BAD_REQUEST);
    }
  });
});
