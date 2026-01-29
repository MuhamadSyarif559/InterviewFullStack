import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { catchError, filter, finalize, map, of, switchMap, take } from 'rxjs';
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

  loading = false;
  error = '';

  tenantId = 0;
  createdBy = 0;

  editorOpen = false;
  editingStockInId: number | null = null;

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
      catchError(err => {
        this.error = err?.error ?? 'Unable to load stock in records';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  // =========================
  // UI ACTIONS
  // =========================
  openCreate(): void {
    this.editingStockInId = null;
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
}
