import prisma from '../../src/prisma';
import { PrismaClient } from '@prisma/client';
import { findUserById } from '../../src/repository/userRepository';
import { prismaMock } from '../../src/singleton';
const prismaForHardDelete = new PrismaClient();
describe('find user by id', () => {
  test('find mocked user ', async () => {
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
    await prisma.users.create({ data: user });
    const id = await prisma.users.findFirst({
      where: { nick: '테스트유저' },
      select: { id: true },
    });
    await expect(findUserById(+id.id)).resolves.toEqual({
      id: id.id,
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
      where: { id: id.id },
    });
  });
});
