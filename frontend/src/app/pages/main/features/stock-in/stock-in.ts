import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, finalize, map, of, take, tap } from 'rxjs';
import { StockInDialog } from './stock-in-dialog/stock-in-dialog';
import { StockInService, StockIn as StockInRecord } from '../../../../services/stock-in';
import { SessionService } from '../../../../services/session';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-stock-in',
  imports: [CommonModule, StockInDialog],
  templateUrl: './stock-in.html',
  styleUrl: './stock-in.scss'
})
export class StockIn implements OnInit {
  stockIns$!: Observable<StockInRecord[]>;
  filteredStockIns$!: Observable<StockInRecord[]>;
  stockInsSnapshot: StockInRecord[] = [];

  loading = false;
  error = '';

  tenantId = 0;
  createdBy = 0;

  editorOpen = false;
  editingStockInId: number | null = null;
  suggestedRunningNumber: string | null = null;
  private searchTerm$ = new BehaviorSubject<string>('');

  constructor(
    private stockInService: StockInService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    const session = this.session.value;

    if (session?.tenantID) {
      this.tenantId = session.tenantID;
      this.createdBy = session.userId;
      this.loadStockIns();
      return;
    }

    // wait for session to be ready
    this.session.session$
      .pipe(
        filter(s => !!s?.tenantID),
        take(1)
      )
      .subscribe(s => {
        this.tenantId = s!.tenantID;
        this.createdBy = s!.userId;
        this.loadStockIns();
      });
  }

  // =========================
  // LOAD (ASYNC)
  // =========================
  private loadStockIns(): void {
    if (!this.tenantId) {
      this.error = 'No tenant found in session.';
      this.stockIns$ = of([]);
      return;
    }

    this.loading = true;
    this.error = '';

    this.stockIns$ = this.stockInService.listByTenant(this.tenantId).pipe(
      map(records => records ?? []),
      tap(records => {
        this.stockInsSnapshot = records ?? [];
      }),
      catchError(err => {
        this.error = err?.error ?? 'Unable to load stock in records';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );

    this.filteredStockIns$ = combineLatest([this.stockIns$, this.searchTerm$]).pipe(
      map(([records, term]) => this.filterStockIns(records, term))
    );
  }

  // =========================
  // UI ACTIONS
  // =========================
  openCreate(): void {
    this.editingStockInId = null;
    this.suggestedRunningNumber = this.computeNextRunningNumber('SI', this.stockInsSnapshot);
    this.editorOpen = true;
  }

  closeCreate(): void {
    this.editorOpen = false;
  }

  handleSaved(): void {
    this.loadStockIns();
  }

  openEdit(record: StockInRecord): void {
    this.editingStockInId = record.id;
    this.suggestedRunningNumber = null;
    this.editorOpen = true;
  }

  deleteStockIn(record: StockInRecord): void {
    if (!record?.id) return;
    if (!confirm(`Delete ${record.runningNumber}?`)) return;

    this.loading = true;
    this.error = '';

    this.stockInService.delete(record.id)
      .pipe(
        catchError(err => {
          this.error = err?.error ?? 'Unable to delete stock in';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.loadStockIns();
      });
  }

  private computeNextRunningNumber(prefix: string, records: StockInRecord[]): string {
    if (!records?.length) {
      return `${prefix}001`;
    }
    let max = 0;
    for (const record of records) {
      const raw = (record?.runningNumber ?? '').replace(/[^0-9]/g, '');
      if (!raw) continue;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        max = Math.max(max, parsed);
      }
    }
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  updateSearch(term: string): void {
    this.searchTerm$.next(term ?? '');
  }

  private filterStockIns(records: StockInRecord[], term: string): StockInRecord[] {
    const query = (term ?? '').toLowerCase().trim();
    if (!query) return records;
    return records.filter(record => {
      const running = (record.runningNumber ?? '').toLowerCase();
      const desc = (record.description ?? '').toLowerCase();
      const status = record.finalized ? 'finalized' : 'draft';
      return running.includes(query) || desc.includes(query) || status.includes(query);
    });
  }
}
