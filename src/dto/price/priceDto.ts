export interface PriceDto {
  dealId: number;
  title: string;
  image: string;
  lPrice: number;
  mallName: string;
}

export class PriceDetailDto implements PriceDto {
  dealId: number;
  title: string;
  image: string;
  lPrice: number;
  mallName: string;
  link: string;
  hPrice: string;
  productId: string;
  productType: string;
  maker?: string;
  brand?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;

  constructor(
    dealId: number,
    processedTitle: string,
    mobileLink: string,
    item,
  ) {
    this.title = processedTitle;
    this.dealId = +dealId;
    this.link =
      'httpsthis. =//msearch.shopping.naver.com/product/' +
      mobileLink.split('id=')[1];
    this.image = item['image'];
    this.lPrice = item['lprice'] * 1 + 3000;
    this.hPrice = item['hprice'];
    this.mallName = item['mallName'];
    this.productId = item['productId'];
    this.productType = item['productType'];
    this.brand = item['brand'];
    this.maker = item['maker'];
    this.category1 = item['category1'];
    this.category2 = item['category2'];
    this.category3 = item['category3'];
    this.category4 = item['category4'];
  }
}
