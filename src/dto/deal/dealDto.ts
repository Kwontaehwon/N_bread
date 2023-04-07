class dealDto {
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

  constructor(
    id: Number,
    link: String,
    title: String,
    content: String,
    totalPrice: Number,
    personalPrice: Number,
    totalMember: Number,
    dealDate: Date,
    dealPlace: String,
    loc1: String,
    loc2: String,
    loc3: String,
  ) {
    this.id = id;
    this.link = link;
    this.title = title;
    this.content = content;
    this.totalPrice = totalPrice;
    this.personalPrice = personalPrice;
    this.totalMember = totalMember;
    this.dealDate = dealDate;
    this.dealPlace = dealPlace;
    this.loc1 = loc1;
    this.loc2 = loc2;
    this.loc3 = loc3;
  }
}

export { dealDto };
