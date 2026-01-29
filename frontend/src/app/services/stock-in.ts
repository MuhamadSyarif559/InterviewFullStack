import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface StockInDetail {
  id?: number;
  productName: string;
  sku?: string | null;
  quantity: number;
  stockInId?: number | null;
}

export interface StockIn {
  id: number;
  runningNumber: string;
  description?: string | null;
  date: string;
  createdBy?: number | null;
  tenantId: number;
  details?: StockInDetail[];
}

@Injectable({ providedIn: 'root' })
export class StockInService {
  private baseUrl = 'http://localhost:8080/api/stock-in';

  constructor(private http: HttpClient) {}

  listByTenant(tenantId: number) {
    return this.http.get<StockIn[]>(
      `${this.baseUrl}/tenant/${tenantId}`,
      { withCredentials: true }
    );
  }

  getById(id: number) {
    return this.http.get<StockIn>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  create(payload: {
    description?: string;
    date?: string;
    createdBy?: number;
    tenantId: number;
  }) {
    return this.http.post<StockIn>(
      this.baseUrl,
      payload,
      { withCredentials: true }
    );
  }

  update(id: number, payload: {
    description?: string;
    date?: string;
    createdBy?: number;
  }) {
    return this.http.put<StockIn>(
      `${this.baseUrl}/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  getNextNumber(tenantId: number) {
    return this.http.get<string>(
      `${this.baseUrl}/next-number/tenant/${tenantId}`,
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
