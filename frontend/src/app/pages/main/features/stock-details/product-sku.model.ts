export interface ProductSku {
  id: number;
  skuCode: string;
  colour?: string | null;
  size?: string | null;
  quantityAvailable: number;
  image?: string | null;
  productId?: number | null;
  tenantID?: number | null;
}
