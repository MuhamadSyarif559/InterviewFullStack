import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, concatMap, finalize, map, of, toArray } from 'rxjs';
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
export class StockInDialog implements OnInit {
  @Input() tenantId = 0;
  @Input() createdBy = 0;
  @Input() stockInId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = false;
  saveError = '';
  productLoading = false;
  productError = '';
  runningNumber = 'SI001';

  products: Product[] = [];
  private skusByProduct = new Map<number, ProductSku[]>();
  activeSearchIndex: number | null = null;

  stockInForm: FormGroup;

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
    this.loadProducts();
    if (this.stockInId) {
      this.loadExisting(this.stockInId);
    } else {
      this.addDetail();
      this.loadNextNumber();
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
        this.saved.emit();
      });
  }

  close(): void {
    this.closed.emit();
  }

  loadProducts(): void {
    if (!this.tenantId) return;
    this.productLoading = true;
    this.productError = '';

    this.productService.listProducts(this.tenantId)
      .pipe(
        catchError((err) => {
          this.productError = err?.error ?? 'Unable to load products';
          return of([]);
        }),
        finalize(() => {
          this.productLoading = false;
        })
      )
      .subscribe((products: Product[]) => {
        this.products = Array.isArray(products) ? products : [];
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
        this.runningNumber = num || 'SI001';
      });
  }

  private loadExisting(stockInId: number): void {
    this.stockInService.getById(stockInId)
      .pipe(
        catchError((err) => {
          this.saveError = err?.error ?? 'Unable to load stock in';
          return of(null);
        })
      )
      .subscribe((record: StockInRecord | null) => {
        if (!record) return;
        this.runningNumber = record.runningNumber || 'SI001';
        this.stockInForm.patchValue({
          description: record.description ?? '',
          date: record.date ? record.date.slice(0, 10) : this.today()
        });
        this.loadDetails(stockInId);
      });
  }

  private loadDetails(stockInId: number): void {
    this.stockInDetailService.listByStockIn(stockInId)
      .pipe(catchError(() => of([])))
      .subscribe((details: StockInDetail[]) => {
        while (this.details.length) {
          this.details.removeAt(0);
        }
        if (!details.length) {
          this.addDetail();
          return;
        }
        details.forEach((detail) => {
          const match = this.products.find((p) => p.productName === detail.productName);
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
            this.loadSkusForProduct(productId, this.details.length - 1);
          }
        });
      });
  }

  getFilteredProducts(index: number): Product[] {
    const group = this.details.at(index);
    const term = (group?.get('searchTerm')?.value ?? '').toString().toLowerCase().trim();
    if (!term) return this.products;
    return this.products.filter((p) => (p.productName ?? '').toLowerCase().includes(term));
  }

  selectProduct(index: number, productId: number | null): void {
    const group = this.details.at(index);
    if (!group) return;

    const selected = this.products.find((p) => p.id === Number(productId));
    group.patchValue({
      productId: selected?.id ?? null,
      productName: selected?.productName ?? '',
      sku: ''
    });

    if (!selected?.id) return;
    this.loadSkusForProduct(selected.id, index);
  }

  getSkusForDetail(index: number): ProductSku[] {
    const group = this.details.at(index);
    const productId = Number(group?.get('productId')?.value ?? 0);
    if (!productId) return [];
    return this.skusByProduct.get(productId) ?? [];
  }

  setActiveSearch(index: number): void {
    this.activeSearchIndex = index;
  }

  clearActiveSearch(): void {
    this.activeSearchIndex = null;
  }

  private loadSkusForProduct(productId: number, index: number): void {
    if (this.skusByProduct.has(productId)) {
      this.autoSelectSkuIfSingle(index, productId);
      return;
    }

    this.productService.listSkus(productId)
      .pipe(catchError(() => of([])))
      .subscribe((skus: ProductSku[]) => {
        const list = Array.isArray(skus) ? skus : [];
        this.skusByProduct.set(productId, list);
        this.autoSelectSkuIfSingle(index, productId);
      });
  }

  private autoSelectSkuIfSingle(index: number, productId: number): void {
    const skus = this.skusByProduct.get(productId) ?? [];
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
