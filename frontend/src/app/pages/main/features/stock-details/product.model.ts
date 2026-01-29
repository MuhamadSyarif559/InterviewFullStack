export interface Product {
  id: number;
  productName: string;
  description?: string | null;
  productImage?: string | null;
  createdBy?: number | null;
  tenantid?: number | null;
  tenantID?: number | null;
}
