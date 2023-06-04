export interface priceDto {
  dealId: number;
  title: string;
  image: string;
  lPrice: number;
  mallName: string;
}

export interface priceDetailDto extends priceDto {
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
}
