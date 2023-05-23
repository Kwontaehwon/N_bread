import { deals } from '@prisma/client';

class DealDto {
  id: Number;
  link: String;
  title: String;
  content: String;
  totalPrice: Number;
  personalPrice: Number;
  totalMember: Number;
  dealDate: Date;
  dealPlace: String;
  loc1: String;
  loc2: String;
  loc3: String;

  constructor(deal: deals) {
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
  }
}

export { DealDto };
