import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';

export interface StockLedgerEntry {
  type: 'IN' | 'OUT';
  recordId: number;
  runningNumber: string;
  date: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  createdById?: number | null;
  createdByName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class StockLedgerService {
  private baseUrl = `${environment.apiBaseUrl}/stock-ledger`;

  constructor(private http: HttpClient) {}

  listByTenant(tenantId: number) {
    return this.http.get<StockLedgerEntry[]>(
      `${this.baseUrl}/tenant/${tenantId}`,
      { withCredentials: true }
    );
  }
}
