import { comments } from '@prisma/client';

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

export { CommentDto };
