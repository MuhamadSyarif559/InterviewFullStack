import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, concatMap, filter, finalize, map, Observable, of, shareReplay, startWith, switchMap, take, tap, toArray } from 'rxjs';
import { Product } from '../../stock-details/product.model';
import { ProductSku } from '../../stock-details/product-sku.model';
import { ProductService } from '../../../../../services/product';
import { StockInService, StockIn as StockInRecord } from '../../../../../services/stock-in';
import { StockInDetail, StockInDetailService } from '../../../../../services/stock-in-detail';

type DetailItem = {
  index: number;
  id: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
};

@Component({
  standalone: true,
  selector: 'app-stock-in-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-in-dialog.html',
  styleUrl: './stock-in-dialog.scss'
})
export class StockInDialog implements OnInit, OnChanges {
  @Input() tenantId = 0;
  @Input() createdBy = 0;
  @Input() stockInId: number | null = null;
  @Input() suggestedRunningNumber: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = false;
  saveError = '';
  runningNumber = 'SI001';
  isFinalized = false;

  productsVm$!: Observable<{ items: Product[]; loading: boolean; error: string }>;
  private tenantIdSubject = new BehaviorSubject<number>(0);
  private skusByProduct$ = new Map<number, Observable<ProductSku[]>>();
  activeSearchIndex: number | null = null;

  stockInForm: FormGroup;
  stockIn$!: Observable<StockInRecord | null>;
  constructor(
    private fb: FormBuilder,
    private stockInService: StockInService,
    private stockInDetailService: StockInDetailService,
    private productService: ProductService
  ) {
    this.stockInForm = this.fb.group({
      description: [''],
      date: [this.today(), Validators.required],
      details: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.tenantIdSubject.next(this.tenantId);
    if (!this.stockInId && this.suggestedRunningNumber) {
      this.runningNumber = this.suggestedRunningNumber;
    }
    this.productsVm$ = this.tenantIdSubject.pipe(
      switchMap((tenantId) => {
        if (!tenantId) {
          return of({ items: [], loading: false, error: 'No tenant found in session.' });
        }
        return this.productService.listProducts(tenantId).pipe(
          map((products: Product[]) => ({
            items: Array.isArray(products) ? products : [],
            loading: false,
            error: ''
          })),
          startWith({ items: [], loading: true, error: '' }),
          catchError((err) => of({
            items: [],
            loading: false,
            error: err?.error ?? 'Unable to load products'
          }))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    if (this.stockInId) {
      this.loadExisting(this.stockInId);
      this.loadDetails(this.stockInId);
    } else {
      this.resetForNew();
      this.loadNextNumber();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantId'] && !changes['tenantId'].firstChange) {
      this.tenantIdSubject.next(this.tenantId);
    }
    if (changes['suggestedRunningNumber'] && !changes['suggestedRunningNumber'].firstChange) {
      if (!this.stockInId && this.suggestedRunningNumber) {
        this.runningNumber = this.suggestedRunningNumber;
      }
    }
    if (changes['stockInId'] && !changes['stockInId'].firstChange) {
      if (this.stockInId) {
        this.loadExisting(this.stockInId);
      } else {
        this.resetForNew();
      }
    }
  }
  get details(): FormArray {
    return this.stockInForm.get('details') as FormArray;
  }

  addDetail(): void {
    this.details.push(this.fb.group({
      id: [null],
      searchTerm: [''],
      productId: [null, Validators.required],
      productName: ['', Validators.required],
      sku: [''],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeDetail(index: number): void {
    if (this.isFinalized) return;
    if (this.details.length <= 1) return;
    const group = this.details.at(index);
    const id = group?.get('id')?.value as number | null;
    if (this.stockInId && id) {
      this.stockInDetailService.delete(id)
        .pipe(
          catchError((err) => {
            this.saveError = err?.error ?? 'Unable to delete stock in detail';
            return of(null);
          })
        )
        .subscribe(() => {
          this.details.removeAt(index);
        });
      return;
    }
    this.details.removeAt(index);
  }

  saveStockIn(): void {
    if (this.isFinalized) return;
    if (this.stockInForm.invalid) {
      this.stockInForm.markAllAsTouched();
      return;
    }
    if (!this.tenantId) {
      this.saveError = 'No tenant found in session.';
      return;
    }

    this.saving = true;
    this.saveError = '';

    const formValue = this.stockInForm.getRawValue();
    const headerPayload = {
      description: formValue.description,
      date: this.toIsoDateTime(formValue.date),
      createdBy: this.createdBy,
      tenantId: this.tenantId
    };

    const createOrUseHeader$ = this.stockInId
      ? this.stockInService.update(this.stockInId, headerPayload)
      : this.stockInService.create(headerPayload);

    createOrUseHeader$
      .pipe(
        concatMap((created: StockInRecord) => {
          this.stockInId = created.id;
          this.runningNumber = created.runningNumber || this.runningNumber;

          const items: DetailItem[] = (formValue.details ?? []).map((item: any, index: number) => ({
            index,
            id: item.id as number | null,
            productName: item.productName,
            sku: item.sku || null,
            quantity: Number(item.quantity ?? 0)
          }));

          return of(items).pipe(
            concatMap((detailItems: DetailItem[]) =>
              detailItems.length
                ? of(detailItems).pipe(
                  concatMap((list: DetailItem[]) => list),
                  concatMap((detail: DetailItem) =>
                    (detail.id
                      ? this.stockInDetailService.update(detail.id, {
                        productName: detail.productName,
                        sku: detail.sku,
                        quantity: detail.quantity
                      })
                      : this.stockInDetailService.create(created.id, {
                        productName: detail.productName,
                        sku: detail.sku,
                        quantity: detail.quantity
                      })
                    ).pipe(
                      map((savedDetail) => ({ index: detail.index, savedDetail }))
                    )
                  ),
                  toArray()
                )
                : of([])
            )
          );
        }),
        catchError((err) => {
          this.saveError = err?.error ?? 'Unable to save stock in';
          return of([]);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe((savedDetails: Array<{ index: number; savedDetail: StockInDetail }>) => {
        if (Array.isArray(savedDetails)) {
          savedDetails.forEach(({ index, savedDetail }) => {
            const group = this.details.at(index);
            if (group && savedDetail?.id) {
              group.patchValue({ id: savedDetail.id });
            }
          });
        }
        if (this.stockInId) {
          this.loadExisting(this.stockInId);
        }
        this.saved.emit();
      });
  }

  close(): void {
    this.closed.emit();
  }

  finalizeStockIn(): void {
    if (!this.stockInId || this.isFinalized) return;
    this.saving = true;
    this.saveError = '';

    this.stockInService.finalize(this.stockInId)
      .pipe(
        catchError((err) => {
          this.saveError = err?.error ?? 'Unable to finalize stock in';
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe((record) => {
        if (!record) return;
        this.runningNumber = record.runningNumber || this.runningNumber;
        this.isFinalized = true;
        this.stockInForm.disable({ emitEvent: false });
        this.saved.emit();
      });
  }

  loadNextNumber(): void {
    if (!this.tenantId) {
      this.runningNumber = 'SI001';
      return;
    }
    this.stockInService.getNextNumber(this.tenantId)
      .pipe(
        catchError(() => of('SI001'))
      )
      .subscribe((num: string) => {
        this.runningNumber = num;
        console.log("tenatid", this.tenantId)
        console.log("running number", this.runningNumber)
      });
  }

  private loadExisting(stockInId: number): void {
    this.saveError = '';

    this.stockIn$ = this.stockInService.getById(stockInId).pipe(
      tap(record => {
        if (!record) return;

        this.runningNumber = record.runningNumber || 'SI001';
        this.isFinalized = !!record.finalized;

        this.stockInForm.patchValue({
          description: record.description ?? '',
          date: record.date ? record.date.slice(0, 10) : this.today()
        });

        if (this.isFinalized) {
          this.stockInForm.disable({ emitEvent: false });
        } else {
          this.stockInForm.enable({ emitEvent: false });
        }
      }),


      tap(record => {
        if (record?.id) {
          this.loadDetails(record.id);
        }
      }),

      catchError(err => {
        this.saveError = err?.error ?? 'Unable to load stock in';
        return of(null);
      })
    );
  }

  private resetForNew(): void {
    this.isFinalized = false;
    this.runningNumber = this.suggestedRunningNumber || 'SI001';
    this.saveError = '';
    this.stockInForm.enable({ emitEvent: false });
    this.stockInForm.reset({
      description: '',
      date: this.today()
    });
    while (this.details.length) {
      this.details.removeAt(0);
    }
    this.addDetail();
    this.loadNextNumber();
  }

  private loadDetails(stockInId: number): void {
    combineLatest([
      this.stockInDetailService.listByStockIn(stockInId).pipe(catchError(() => of([]))),
      this.productsVm$.pipe(
        filter((vm) => !vm.loading),
        map((vm) => vm.items)
      )
    ])
      .pipe(take(1))
      .subscribe(([details, products]) => {
        while (this.details.length) {
          this.details.removeAt(0);
        }
        if (!details.length) {
          this.addDetail();
          return;
        }
        details.forEach((detail) => {
          const match = products.find((p) => p.productName === detail.productName);
          const productId = match?.id ?? null;
          const group = this.fb.group({
            id: [detail.id],
            searchTerm: [detail.productName],
            productId: [productId, Validators.required],
            productName: [detail.productName, Validators.required],
            sku: [detail.sku ?? ''],
            quantity: [detail.quantity, [Validators.required, Validators.min(1)]]
          });
          this.details.push(group);
          if (productId) {
            this.preloadSkus(productId, this.details.length - 1);
          }
        });
      });
  }

  getFilteredProducts(index: number, products: Product[]): Product[] {
    const group = this.details.at(index);
    const term = (group?.get('searchTerm')?.value ?? '').toString().toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) => (p.productName ?? '').toLowerCase().includes(term));
  }

  selectProduct(index: number, productId: number | null, products: Product[]): void {
    const group = this.details.at(index);
    if (!group) return;

    const selected = products.find((p) => p.id === Number(productId));
    group.patchValue({
      productId: selected?.id ?? null,
      productName: selected?.productName ?? '',
      sku: ''
    });

    if (!selected?.id) return;
    this.preloadSkus(selected.id, index);
  }

  getSkusForDetail$(index: number): Observable<ProductSku[]> {
    const group = this.details.at(index);
    const productId = Number(group?.get('productId')?.value ?? 0);
    if (!productId) return of([]);
    return this.getSkusForProduct$(productId);
  }

  setActiveSearch(index: number): void {
    this.activeSearchIndex = index;
  }

  clearActiveSearch(): void {
    this.activeSearchIndex = null;
  }

  private preloadSkus(productId: number, index: number): void {
    this.getSkusForProduct$(productId)
      .pipe(take(1))
      .subscribe((skus: ProductSku[]) => {
        this.autoSelectSkuIfSingle(index, skus);
      });
  }

  private getSkusForProduct$(productId: number): Observable<ProductSku[]> {
    const existing = this.skusByProduct$.get(productId);
    if (existing) return existing;
    const skus$ = this.productService.listSkus(productId).pipe(
      map((skus: ProductSku[]) => (Array.isArray(skus) ? skus : [])),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.skusByProduct$.set(productId, skus$);
    return skus$;
  }

  private autoSelectSkuIfSingle(index: number, skus: ProductSku[]): void {
    const group = this.details.at(index);
    if (!group) return;

    if (skus.length === 1) {
      group.patchValue({ sku: skus[0].skuCode ?? '' });
    }
  }

  private today(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }

  private toIsoDateTime(value: string): string {
    if (!value) return new Date().toISOString();
    return new Date(`${value}T00:00:00`).toISOString();
  }
}
