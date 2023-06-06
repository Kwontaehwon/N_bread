import { replies, users } from '@prisma/client';

class ReplyDto {
  id: number;
  userId: number;
  dealId: number;
  content: string;
  parentId: number;

  constructor(reply: replies) {
    this.id = reply.id;
    this.userId = reply.userId;
    this.dealId = reply.dealId;
    this.parentId = reply.parentId;
    this.content = reply.content;
  }
}

class ReplyWithUserDto extends ReplyDto {
  deletedAt: Date;
  users: {
    nick: string;
    userStatus: string;
  };

  constructor(reply: replies, users: users) {
    super(reply);
    this.deletedAt = reply.deletedAt;
    this.users = {
      nick: users.nick,
      userStatus: users.userStatus,
    };
  }
}

export { ReplyDto, ReplyWithUserDto };
