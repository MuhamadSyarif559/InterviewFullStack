import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../pages/main/features/stock-details/product.model';
import { ProductSku } from '../pages/main/features/stock-details/product-sku.model';
import { environment } from '../../enviroment/enviroment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = `${environment.apiBaseUrl}/products`;
  private skuUrl = `${environment.apiBaseUrl}/product-skus`;

  constructor(private http: HttpClient) {}

  listProducts(tenantId: number) {
    return this.http.get<Product[]>(
      `${this.baseUrl}/tenant/${tenantId}`,
      { withCredentials: true }
    );
  }

  getProduct(id: number) {
    return this.http.get<Product>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  createProduct(payload: {
    productName: string;
    description?: string;
    productImage?: string;
    tenantid: number;
  }) {
    return this.http.post<Product>(
      this.baseUrl,
      payload,
      { withCredentials: true }
    );
  }

  updateProduct(id: number, payload: {
    productName: string;
    description?: string;
    productImage?: string;
    tenantid: number;
  }) {
    return this.http.put<Product>(
      `${this.baseUrl}/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  deleteProduct(id: number) {
    return this.http.delete(
      `${this.baseUrl}/${id}`,
      { withCredentials: true, responseType: 'text' }
    );
  }

  uploadProductImage(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{ path: string }>(
      `${this.baseUrl}/upload-image`,
      data,
      { withCredentials: true }
    );
  }

  listSkus(productId: number) {
    return this.http.get<ProductSku[]>(
      `${this.skuUrl}/product/${productId}`,
      { withCredentials: true }
    );
  }

  createSku(productId: number, payload: {
    skuCode: string;
    colour?: string;
    size?: string;
    quantityAvailable: number;
    image?: string;
    tenantID: number;
  }) {
    return this.http.post<ProductSku>(
      `${this.skuUrl}/product/${productId}`,
      payload,
      { withCredentials: true }
    );
  }

  updateSku(skuId: number, payload: {
    skuCode: string;
    colour?: string;
    size?: string;
    quantityAvailable: number;
    image?: string;
    tenantID: number;
  }) {
    return this.http.put<ProductSku>(
      `${this.skuUrl}/${skuId}`,
      payload,
      { withCredentials: true }
    );
  }

  deleteSku(skuId: number) {
    return this.http.delete(
      `${this.skuUrl}/${skuId}`,
      { withCredentials: true, responseType: 'text' }
    );
  }
}
