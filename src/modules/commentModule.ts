import { comments, replies } from '@prisma/client';

const markCommentStatus = async (
  text: comments[] | replies[],
  suggester,
  groupMember,
) => {
  if (text['deletedAt'] != null) {
    text['content'] = '삭제된 댓글입니다.';
  }
  // comments UserStatus
  if (text['userId'] === suggester) {
    text['User']['userStatus'] = '제안자';
  } else if (groupMember.includes(text['userId'])) {
    text['User']['userStatus'] = '참여자';
  } else {
    text['User']['userStatus'] = '';
  }
};

export { markCommentStatus };
