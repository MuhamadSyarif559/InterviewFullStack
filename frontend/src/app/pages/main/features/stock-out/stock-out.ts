import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { catchError, filter, finalize, map, of, take } from 'rxjs';
import { Observable } from 'rxjs';
import { StockOutDialog } from './stock-out-dialog/stock-out-dialog';
import { StockOutService, StockOut as StockOutRecord } from '../../../../services/stock-out';
import { SessionService } from '../../../../services/session';

@Component({
  standalone: true,
  selector: 'app-stock-out',
  imports: [CommonModule, StockOutDialog],
  templateUrl: './stock-out.html',
  styleUrl: './stock-out.scss'
})
export class StockOut implements OnInit {
  stockOuts$!: Observable<StockOutRecord[]>;

  loading = false;
  error = '';

  tenantId = 0;
  createdBy = 0;

  editorOpen = false;
  editingStockOutId: number | null = null;

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
      catchError(err => {
        this.error = err?.error ?? 'Unable to load stock out records';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  openCreate(): void {
    this.editingStockOutId = null;
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
    this.editorOpen = true;
  }

  deleteStockOut(record: StockOutRecord): void {
    if (!record?.id) return;
    if (!confirm(`Delete ${record.runningNumber}?`)) return;

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
}
