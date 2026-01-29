import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface StockInDetail {
  id: number;
  productName: string;
  sku?: string | null;
  quantity: number;
  stockInId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class StockInDetailService {
  private baseUrl = 'http://localhost:8080/api/stock-in-details';

  constructor(private http: HttpClient) {}

  listByStockIn(stockInId: number) {
    return this.http.get<StockInDetail[]>(
      `${this.baseUrl}/stock-in/${stockInId}`,
      { withCredentials: true }
    );
  }

  create(stockInId: number, payload: {
    productName: string;
    sku?: string | null;
    quantity: number;
  }) {
    return this.http.post<StockInDetail>(
      `${this.baseUrl}/stock-in/${stockInId}`,
      payload,
      { withCredentials: true }
    );
  }

  update(id: number, payload: {
    productName: string;
    sku?: string | null;
    quantity: number;
  }) {
    return this.http.put<StockInDetail>(
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
