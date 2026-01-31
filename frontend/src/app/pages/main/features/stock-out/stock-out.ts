import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, finalize, map, of, take, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { StockOutDialog } from './stock-out-dialog/stock-out-dialog';
import { StockOutService, StockOut as StockOutRecord } from '../../../../services/stock-out';
import { SessionService } from '../../../../services/session';
import { ConfirmDialogComponent } from '../../../../components/confirm-dialog/confirm-dialog';

@Component({
  standalone: true,
  selector: 'app-stock-out',
  imports: [CommonModule, StockOutDialog, ConfirmDialogComponent],
  templateUrl: './stock-out.html',
  styleUrl: './stock-out.scss'
})
export class StockOut implements OnInit {
  stockOuts$!: Observable<StockOutRecord[]>;
  filteredStockOuts$!: Observable<StockOutRecord[]>;
  stockOutsSnapshot: StockOutRecord[] = [];

  loading = false;
  error = '';

  tenantId = 0;
  createdBy = 0;

  editorOpen = false;
  editingStockOutId: number | null = null;
  suggestedRunningNumber: string | null = null;
  private searchTerm$ = new BehaviorSubject<string>('');

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingDelete: StockOutRecord | null = null;

  constructor(
    private stockOutService: StockOutService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    const session = this.session.value;

    if (session?.tenantID) {
      this.tenantId = session.tenantID;
      this.createdBy = session.userId;
      this.loadStockOuts();
      return;
    }

    this.session.session$
      .pipe(
        filter(s => !!s?.tenantID),
        take(1)
      )
      .subscribe(s => {
        this.tenantId = s!.tenantID;
        this.createdBy = s!.userId;
        this.loadStockOuts();
      });
  }

  private loadStockOuts(): void {
    if (!this.tenantId) {
      this.error = 'No tenant found in session.';
      this.stockOuts$ = of([]);
      return;
    }

    this.loading = true;
    this.error = '';

    this.stockOuts$ = this.stockOutService.listByTenant(this.tenantId).pipe(
      map(records => records ?? []),
      tap(records => {
        this.stockOutsSnapshot = records ?? [];
      }),
      catchError(err => {
        this.error = err?.error ?? 'Unable to load stock out records';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );

    this.filteredStockOuts$ = combineLatest([this.stockOuts$, this.searchTerm$]).pipe(
      map(([records, term]) => this.filterStockOuts(records, term))
    );
  }

  openCreate(): void {
    this.editingStockOutId = null;
    this.suggestedRunningNumber = this.computeNextRunningNumber('SO', this.stockOutsSnapshot);
    this.editorOpen = true;
  }

  closeCreate(): void {
    this.editorOpen = false;
  }

  handleSaved(): void {
    this.loadStockOuts();
  }

  openEdit(record: StockOutRecord): void {
    this.editingStockOutId = record.id;
    this.suggestedRunningNumber = null;
    this.editorOpen = true;
  }

  requestDeleteStockOut(record: StockOutRecord): void {
    if (!record?.id || record.finalized) return;
    this.pendingDelete = record;
    this.confirmTitle = 'Delete stock out record?';
    this.confirmMessage = `Delete ${record.runningNumber}? This cannot be undone.`;
    this.confirmOpen = true;
  }

  confirmDeleteStockOut(): void {
    const record = this.pendingDelete;
    if (!record?.id) {
      this.closeConfirm();
      return;
    }

    this.closeConfirm();
    this.loading = true;
    this.error = '';

    this.stockOutService.delete(record.id)
      .pipe(
        catchError(err => {
          this.error = err?.error ?? 'Unable to delete stock out';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.loadStockOuts();
      });
  }

  cancelDeleteStockOut(): void {
    this.closeConfirm();
  }

  private closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDelete = null;
  }

  private computeNextRunningNumber(prefix: string, records: StockOutRecord[]): string {
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

  private filterStockOuts(records: StockOutRecord[], term: string): StockOutRecord[] {
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
