import { comments, groups, replies } from '@prisma/client';
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

export { extractGroupMemberId, makeGroupDtoList };
