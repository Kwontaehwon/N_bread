import { comments, users } from '@prisma/client';
import { CommentWithUserDto } from './commentDto';
import { ReplyWithUserDto } from './replyDto';

class CommentWithReplyDto {
  comment: CommentWithUserDto;
  replies: ReplyWithUserDto[];

  constructor(commentWithUserDto: CommentWithUserDto) {
    this.comment = commentWithUserDto;
    this.replies = [];
  }
}

export { CommentWithReplyDto };
