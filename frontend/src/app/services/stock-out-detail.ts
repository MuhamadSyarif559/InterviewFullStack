import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';

export interface StockOutDetail {
  id: number;
  productName: string;
  sku?: string | null;
  quantity: number;
  stockOutId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class StockOutDetailService {
  private baseUrl = `${environment.apiBaseUrl}/stock-out-details`;

  constructor(private http: HttpClient) {}

  listByStockOut(stockOutId: number) {
    return this.http.get<StockOutDetail[]>(
      `${this.baseUrl}/stock-out/${stockOutId}`,
      { withCredentials: true }
    );
  }

  create(stockOutId: number, payload: {
    productName: string;
    sku?: string | null;
    quantity: number;
  }) {
    return this.http.post<StockOutDetail>(
      `${this.baseUrl}/stock-out/${stockOutId}`,
      payload,
      { withCredentials: true }
    );
  }

  update(id: number, payload: {
    productName: string;
    sku?: string | null;
    quantity: number;
  }) {
    return this.http.put<StockOutDetail>(
      `${this.baseUrl}/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  delete(id: number) {
    return this.http.delete(
      `${this.baseUrl}/${id}`,
      { withCredentials: true, responseType: 'text' }
    );
  }
}
