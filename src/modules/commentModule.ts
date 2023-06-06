import { groups } from '@prisma/client';
import { CommentWithUserDto } from '../dto/commentDto';
import { ReplyWithUserDto } from '../dto/replyDto';
import { CommentWithReplyDto } from '../dto/commentWithReplyDto';
import { GroupDto } from '../dto/groupDto';

const extractGroupMemberId = async (groupList: groups[]) => {
  let groupMember: number[] = [];
  for (let i = 0; i < groupList.length; i++) {
    groupMember.push(groupList[i]['userId']);
  }
  return groupMember;
};

const makeGroupDtoList = async (groupList: groups[]) => {
  let groupDtoList: GroupDto[] = [];
  for (const group of groupList) {
    groupDtoList.push(new GroupDto(group));
  }
  return groupDtoList;
};

const markStatus = async (
  text: CommentWithUserDto | ReplyWithUserDto,
  suggester: number,
  groupMember: number[],
) => {
  if (text.deletedAt != null) {
    text.content = '삭제된 댓글입니다.';
  }
  if (text.userId === suggester) {
    text.users.userStatus = '제안자';
  } else if (groupMember.includes(text.userId)) {
    text.users.userStatus = '참여자';
  } else {
    text.users.userStatus = '';
  }
};

const handleUserStatus = async (comments, suggester, groupMember) => {
  let allCommentWithReplyDtoList: CommentWithReplyDto[] = [];
  for (let i = 0; i < comments.length; i++) {
    const curComment = comments[i];
    const commentWithUserDto = new CommentWithUserDto(
      curComment,
      curComment['users'],
    );
    markStatus(commentWithUserDto, suggester, groupMember);

    const commentWithReplyDto = new CommentWithReplyDto(commentWithUserDto);

    for (let j = 0; j < curComment['replies'].length; j++) {
      const replyWithUserDto = new ReplyWithUserDto(
        curComment['replies'][j],
        curComment['replies'][j]['users'],
      );

      markStatus(replyWithUserDto, suggester, groupMember);

      commentWithReplyDto.replies.push(replyWithUserDto);
    }
    allCommentWithReplyDtoList.push(commentWithReplyDto);
  }
  return allCommentWithReplyDtoList;
};

export { extractGroupMemberId, makeGroupDtoList, markStatus, handleUserStatus };
