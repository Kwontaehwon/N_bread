import { groups } from '@prisma/client';

class GroupDto {
  id: number;
  amonunt: number;
  dealId: number;
  userId: number;

  constructor(group: groups) {
    this.id = group.id;
    this.amonunt = group.amount;
    this.dealId = group.dealId;
    this.userId = group.userId;
  }
}

export { GroupDto };
