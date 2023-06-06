import { comments, users } from '@prisma/client';

class CommentDto {
  id: number;
  userId: number;
  dealId: number;
  content: string;

  constructor(comment: comments) {
    this.id = comment.id;
    this.userId = comment.userId;
    this.dealId = comment.dealId;
    this.content = comment.content;
  }
}

class CommentWithUserDto extends CommentDto {
  deletedAt: Date;
  users: {
    nick: string;
    userStatus: string;
  };

  constructor(comment: comments, users: users) {
    super(comment);
    this.deletedAt = comment.deletedAt;
    this.users = {
      nick: users.nick,
      userStatus: users.userStatus,
    };
  }
}

export { CommentDto, CommentWithUserDto };
