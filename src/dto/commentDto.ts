import { comments } from '@prisma/client';

class CommentDto {
  userId: number;
  dealId: number;
  content: string;

  constructor(comment: comments) {
    this.userId = comment.userId;
    this.dealId = comment.dealId;
    this.content = comment.content;
  }
}

export { CommentDto };
