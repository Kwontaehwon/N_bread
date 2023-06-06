import { replies } from '@prisma/client';

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

export { ReplyDto };
