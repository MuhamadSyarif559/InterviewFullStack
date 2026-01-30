import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, finalize, catchError, map, of, tap } from 'rxjs';
import { StockLedgerEntry, StockLedgerService } from '../../../../services/stock-ledger';
import { SessionService } from '../../../../services/session';

@Component({
  standalone: true,
  selector: 'app-stock-ledger',
  imports: [CommonModule],
  templateUrl: './stock-ledger.html',
  styleUrl: './stock-ledger.scss'
})
export class StockLedger implements OnInit {
  ledger$ = of<StockLedgerEntry[]>([]);
  filteredLedger$ = of<StockLedgerEntry[]>([]);
  creators$ = of<Array<{ id: number; name: string }>>([]);
  loading = false;
  error = '';
  tenantId = 0;
  private productTerm$ = new BehaviorSubject<string>('');
  private createdBy$ = new BehaviorSubject<string>('all');
  private startDate$ = new BehaviorSubject<string>('');
  private endDate$ = new BehaviorSubject<string>('');
  private duration$ = new BehaviorSubject<string>('all');
  private filteredSnapshot: StockLedgerEntry[] = [];

  constructor(
    private ledgerService: StockLedgerService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.tenantId = this.session.value?.tenantID ?? 0;
    this.loadLedger();
  }

  private loadLedger(): void {
    if (!this.tenantId) {
      this.error = 'No tenant found in session.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.ledger$ = this.ledgerService.listByTenant(this.tenantId).pipe(
      map(entries => Array.isArray(entries) ? entries : []),
      catchError(err => {
        this.error = err?.error ?? 'Unable to load stock ledger';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );

    this.creators$ = this.ledger$.pipe(
      map(entries => {
        const mapById = new Map<number, string>();
        for (const entry of entries) {
          const id = entry.createdById ?? 0;
          if (!id) continue;
          const name = entry.createdByName ?? `User #${id}`;
          if (!mapById.has(id)) {
            mapById.set(id, name);
          }
        }
        return Array.from(mapById.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );

    this.filteredLedger$ = combineLatest([
      this.ledger$,
      this.productTerm$,
      this.createdBy$,
      this.startDate$,
      this.endDate$,
      this.duration$
    ]).pipe(
      map(([entries, productTerm, createdBy, startDate, endDate, duration]) =>
        this.filterLedger(entries, productTerm, createdBy, startDate, endDate, duration)
      ),
      tap(filtered => {
        this.filteredSnapshot = filtered;
      })
    );
  }

  updateProductSearch(term: string): void {
    this.productTerm$.next(term ?? '');
  }

  updateCreatedBy(value: string): void {
    this.createdBy$.next(value ?? 'all');
  }

  updateStartDate(value: string): void {
    this.startDate$.next(value ?? '');
    this.duration$.next('custom');
  }

  updateEndDate(value: string): void {
    this.endDate$.next(value ?? '');
    this.duration$.next('custom');
  }

  updateDuration(value: string): void {
    const duration = value ?? 'all';
    this.duration$.next(duration);
    if (duration === 'all') {
      this.startDate$.next('');
      this.endDate$.next('');
      return;
    }
    const now = new Date();
    const days = Number(duration);
    if (Number.isFinite(days) && days > 0) {
      const end = this.formatDate(now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (days - 1));
      this.startDate$.next(this.formatDate(startDate));
      this.endDate$.next(end);
    }
  }

  exportToExcel(): void {
    const rows = this.filteredSnapshot ?? [];
    const header = [
      'Type',
      'Running Number',
      'Date',
      'Product',
      'SKU',
      'Quantity',
      'Created By'
    ];

    const lines = [
      header.join(','),
      ...rows.map(entry => [
        entry.type === 'IN' ? 'Stock in' : 'Stock out',
        this.escapeCsv(entry.runningNumber ?? ''),
        this.escapeCsv(this.formatDateTime(entry.date)),
        this.escapeCsv(entry.productName ?? ''),
        this.escapeCsv(entry.sku ?? ''),
        String(entry.quantity ?? 0),
        this.escapeCsv(entry.createdByName ?? (entry.createdById ? `User #${entry.createdById}` : ''))
      ].join(','))
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-ledger-${this.formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private filterLedger(
    entries: StockLedgerEntry[],
    productTerm: string,
    createdBy: string,
    startDate: string,
    endDate: string,
    duration: string
  ): StockLedgerEntry[] {
    const query = (productTerm ?? '').toLowerCase().trim();
    const createdById = createdBy === 'all' ? null : Number(createdBy);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return (entries ?? []).filter(entry => {
      if (query) {
        const name = (entry.productName ?? '').toLowerCase();
        if (!name.includes(query)) return false;
      }
      if (createdById && entry.createdById !== createdById) {
        return false;
      }
      if (start || end) {
        const entryDate = entry.date ? new Date(entry.date) : null;
        if (!entryDate) return false;
        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;
      }
      return true;
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatDateTime(dateValue: string): string {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/\"/g, '""')}"`;
    }
    return value;
  }
}
