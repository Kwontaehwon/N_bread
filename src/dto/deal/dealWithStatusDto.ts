import { deals } from '@prisma/client';
import { DealDto } from './dealDto';

class DealWithStatusDto extends DealDto {
  status: String;
  myStatus: String;

  super(deal: deals) {
    this.id = deal.id;
    this.link = deal.link;
    this.title = deal.title;
    this.content = deal.content;
    this.totalPrice = deal.totalPrice;
    this.personalPrice = deal.personalPrice;
    this.totalMember = deal.totalMember;
    this.dealDate = deal.dealDate;
    this.dealPlace = deal.dealPlace;
    this.loc1 = deal.loc1;
    this.loc2 = deal.loc2;
    this.loc3 = deal.loc3;
    this.isCertificated = deal.isCertificated;
    this.status = deal.status;
    this.myStatus = deal.mystatus;
  }
}

export { DealWithStatusDto };
