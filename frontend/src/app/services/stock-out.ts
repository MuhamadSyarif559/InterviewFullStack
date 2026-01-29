import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';

export interface StockOutDetail {
  id?: number;
  productName: string;
  sku?: string | null;
  quantity: number;
  stockOutId?: number | null;
}

export interface StockOut {
  id: number;
  runningNumber: string;
  description?: string | null;
  date: string;
  createdBy?: number | null;
  tenantId: number;
  finalized?: boolean;
  details?: StockOutDetail[];
}

@Injectable({ providedIn: 'root' })
export class StockOutService {
  private baseUrl = `${environment.apiBaseUrl}/stock-out`;

  constructor(private http: HttpClient) {}

  listByTenant(tenantId: number) {
    return this.http.get<StockOut[]>(
      `${this.baseUrl}/tenant/${tenantId}`,
      { withCredentials: true }
    );
  }

  getById(id: number) {
    return this.http.get<StockOut>(
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
    return this.http.post<StockOut>(
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
    return this.http.put<StockOut>(
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

  finalize(id: number) {
    return this.http.post<StockOut>(
      `${this.baseUrl}/${id}/finalize`,
      {},
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
