import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../../services/product';
import { SessionService } from '../../../../../services/session';
import { ProductSku } from '../product-sku.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  of,
  tap
} from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-product-editor',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-editor.html',
  styleUrl: './product-editor.scss'
})
export class ProductEditor implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input() dialogMode = false;
  @Input() openProductId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @ViewChild('productImageInput') productImageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('skuImageInput') skuImageInput?: ElementRef<HTMLInputElement>;

  productForm: FormGroup;
  skuForm: FormGroup;

  tenantId = 0;
  productId: number | null = null;
  productMode: 'add' | 'edit' = 'add';

  loading = false;
  saving = false;
  error = '';
  saveError = '';

  imageUploading = false;
  imageUploadError = '';
  imagePreviewUrl = '';
  private productPreviewObjectUrl: string | null = null;

  skuImageUploading = false;
  skuImageUploadError = '';
  skuImagePreviewUrl = '';
  private skuPreviewObjectUrl: string | null = null;

  skus$ = of<ProductSku[]>([]);

  skuMode: 'add' | 'edit' = 'add';
  selectedSku: ProductSku | null = null;
  skuError = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private session: SessionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      description: [''],
      productImage: ['']
    });

    this.skuForm = this.fb.group({
      skuCode: ['', Validators.required],
      colour: [''],
      size: [''],
      quantityAvailable: [0, Validators.required],
      image: ['']
    });
  }

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    const tenant = this.session.value?.tenantID ?? 0;
    if (!tenant) {
      this.error = 'No tenant found in session.';
      return;
    }
    this.tenantId = tenant;

    if (this.dialogMode) {
      if (this.openProductId) {
        console.log("product id", this.openProductId)
        this.loadProduct(this.openProductId);
      } else {
        this.startNew();
      }
      return;
    }

    this.route.paramMap
      .pipe(
        map(params => params.get('id')),
        distinctUntilChanged(),
        tap(idParam => {
          if (!idParam) {
            this.startNew();
            return;
          }

          const id = Number(idParam);
          if (Number.isNaN(id)) {
            this.error = 'Invalid product id.';
            return;
          }

          this.loadProduct(id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // =========================
  // PRODUCT
  // =========================
  startNew(): void {
    this.productId = null;
    this.productMode = 'add';
    this.loading = false;
    this.productForm.reset();
    this.imagePreviewUrl = '';
    this.revokeProductPreview();
    this.skus$ = of([]);
    this.resetSkuForm();
  }

  private loadProduct(productId: number): void {

    this.error = '';
    this.skuError = '';
    this.resetSkuForm();
    this.skus$ = of([]);

    this.productService.getProduct(productId)
      .pipe(
        tap(product => {
          this.productId = product.id;
          this.productMode = 'edit';

          this.productForm.reset({
            productName: product.productName ?? '',
            description: product.description ?? '',
            productImage: product.productImage ?? ''
          });

          this.imagePreviewUrl = this.resolveImage(product.productImage ?? '');
          this.skus$ = this.productService.listSkus(product.id).pipe(
            catchError(err => {
              this.skuError = err?.error ?? 'Unable to load SKUs';
              return of([]);
            })
          );
        }),
        catchError(err => {
          this.error = err?.error ?? 'Unable to load product';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const payload = {
      ...this.productForm.getRawValue(),
      tenantid: this.tenantId
    };

    const wasNew = !this.productId;
    const request$ = this.productId
      ? this.productService.updateProduct(this.productId, payload)
      : this.productService.createProduct(payload);

    request$
      .pipe(
        tap(product => {
          if (wasNew) {
            this.productId = product.id;
            this.productMode = 'edit';
            this.skus$ = this.productService.listSkus(product.id).pipe(
              catchError(err => {
                this.skuError = err?.error ?? 'Unable to load SKUs';
                return of([]);
              })
            );
            if (!this.dialogMode) {
              this.router.navigate(['/main/stock-details', product.id]);
            }
          }

          this.productForm.patchValue({
            productName: product.productName ?? '',
            description: product.description ?? '',
            productImage: product.productImage ?? ''
          });

          this.imagePreviewUrl = this.resolveImage(product.productImage ?? '');
          this.saved.emit();
        }),
        catchError(err => {
          this.saveError = err?.error ?? 'Unable to save product';
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  deleteProduct(): void {
    if (!this.productId) return;
    if (!confirm('Delete this product? This cannot be undone.')) return;

    this.saving = true;
    this.saveError = '';

    this.productService.deleteProduct(this.productId)
      .pipe(
        tap(() => {
          this.saved.emit();
          this.goBack();
        }),
        catchError(err => {
          this.saveError = err?.error ?? 'Unable to delete product';
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
  // =========================
  // IMAGES
  // =========================
  handleImageUpload(event: Event): void {
    const input = (event.currentTarget ?? event.target) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    this.imageUploading = true;
    this.imageUploadError = '';
    this.setProductPreviewFromFile(file);

    this.productService.uploadProductImage(file)
      .pipe(
        tap(res => {
          const path = res.path ?? '';
          this.productForm.patchValue({ productImage: path });
          this.imagePreviewUrl = this.resolveImage(path);
        }),
        catchError(err => {
          this.imageUploadError = err?.error?.error ?? err?.error ?? 'Unable to upload image';
          return of(null);
        }),
        finalize(() => {
          this.imageUploading = false;
          if (input) input.value = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  clearProductImage(): void {
    this.productForm.patchValue({ productImage: '' });
    this.imagePreviewUrl = '';
    this.imageUploadError = '';
    this.revokeProductPreview();
    const input = this.productImageInput?.nativeElement;
    if (input) input.value = '';
  }

  resolveImage(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }

  // =========================
  // SKU
  // =========================
  openAddSku(): void {
    this.resetSkuForm();
  }

  openEditSku(sku: ProductSku): void {
    this.skuMode = 'edit';
    this.selectedSku = sku;
    this.skuImageUploadError = '';
    this.skuImagePreviewUrl = this.resolveImage(sku.image ?? '');

    this.skuForm.reset({
      skuCode: sku.skuCode ?? '',
      colour: sku.colour ?? '',
      size: sku.size ?? '',
      quantityAvailable: sku.quantityAvailable ?? 0,
      image: sku.image ?? ''
    });
  }

  saveSku(): void {
    if (this.skuForm.invalid) {
      this.skuForm.markAllAsTouched();
      return;
    }
    if (!this.productId) {
      this.skuError = 'Save the product before adding SKUs.';
      return;
    }

    const payload = {
      ...this.skuForm.getRawValue(),
      tenantID: this.tenantId
    };

    const request$ =
      this.skuMode === 'add'
        ? this.productService.createSku(this.productId, payload)
        : this.productService.updateSku(this.selectedSku!.id, payload);

    request$
      .pipe(
        tap(() => {
          this.skus$ = this.productService.listSkus(this.productId!).pipe(
            catchError(err => {
              this.skuError = err?.error ?? 'Unable to load SKUs';
              return of([]);
            })
          );
          this.resetSkuForm();
        }),
        catchError(err => {
          this.skuError = err?.error ?? 'Unable to save SKU';
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  deleteSku(sku: ProductSku): void {
    if (!sku?.id) return;
    if (!confirm(`Delete SKU ${sku.skuCode}?`)) return;

    this.skuError = '';
    this.productService.deleteSku(sku.id)
      .pipe(
        tap(() => {
          this.skus$ = this.productService.listSkus(this.productId!).pipe(
            catchError(err => {
              this.skuError = err?.error ?? 'Unable to load SKUs';
              return of([]);
            })
          );
          if (this.selectedSku?.id === sku.id) {
            this.resetSkuForm();
          }
        }),
        catchError(err => {
          this.skuError = err?.error ?? 'Unable to delete SKU';
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
  resetSkuForm(): void {
    this.skuMode = 'add';
    this.selectedSku = null;
    this.skuImagePreviewUrl = '';
    this.revokeSkuPreview();
    this.skuForm.reset({
      skuCode: '',
      colour: '',
      size: '',
      quantityAvailable: 0,
      image: ''
    });
  }

  goBack(): void {
    if (this.dialogMode) {
      this.closed.emit();
      return;
    }
    this.router.navigate(['/main/stock-details']);
  }

  handleSkuImageUpload(event: Event): void {
    const input = (event.currentTarget ?? event.target) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    this.skuImageUploading = true;
    this.skuImageUploadError = '';
    this.setSkuPreviewFromFile(file);

    this.productService.uploadProductImage(file)
      .pipe(
        tap(res => {
          const path = res.path ?? '';
          this.skuForm.patchValue({ image: path });
          this.skuImagePreviewUrl = this.resolveImage(path);
        }),
        catchError(err => {
          this.skuImageUploadError =
            err?.error?.error ?? err?.error ?? 'Unable to upload SKU image';
          return of(null);
        }),
        finalize(() => {
          this.skuImageUploading = false;
          if (input) input.value = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  clearSkuImage(): void {
    this.skuForm.patchValue({ image: '' });
    this.skuImagePreviewUrl = '';
    this.skuImageUploadError = '';
    this.revokeSkuPreview();
    const input = this.skuImageInput?.nativeElement;
    if (input) input.value = '';
  }

  trackBySkuId(_: number, sku: ProductSku): number {
    return sku.id;
  }

  private setProductPreviewFromFile(file: File): void {
    this.revokeProductPreview();
    this.productPreviewObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl = this.productPreviewObjectUrl;
  }

  private setSkuPreviewFromFile(file: File): void {
    this.revokeSkuPreview();
    this.skuPreviewObjectUrl = URL.createObjectURL(file);
    this.skuImagePreviewUrl = this.skuPreviewObjectUrl;
  }

  private revokeProductPreview(): void {
    if (this.productPreviewObjectUrl) {
      URL.revokeObjectURL(this.productPreviewObjectUrl);
      this.productPreviewObjectUrl = null;
    }
  }

  private revokeSkuPreview(): void {
    if (this.skuPreviewObjectUrl) {
      URL.revokeObjectURL(this.skuPreviewObjectUrl);
      this.skuPreviewObjectUrl = null;
    }
  }

}
