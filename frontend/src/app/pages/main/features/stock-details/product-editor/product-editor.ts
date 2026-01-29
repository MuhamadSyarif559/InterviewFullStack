import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../../services/product';
import { SessionService } from '../../../../../services/session';
import { ProductSku } from '../product-sku.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-product-editor',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-editor.html',
  styleUrl: './product-editor.scss'
})
export class ProductEditor implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  productForm: FormGroup;
  skuForm: FormGroup;

  tenantId = 0;
  productId: number | null = null;
  productMode: 'add' | 'edit' = 'add';

  loading = false;
  error = '';
  saving = false;
  saveError = '';

  imageUploading = false;
  imageUploadError = '';
  imagePreviewUrl = '';

  skuImageUploading = false;
  skuImageUploadError = '';
  skuImagePreviewUrl = '';

  skus: ProductSku[] = [];
  skuMode: 'add' | 'edit' = 'add';
  selectedSku: ProductSku | null = null;
  skuLoading = false;
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

    this.route.paramMap
      .pipe(
        map(params => params.get('id')),
        distinctUntilChanged(),
        switchMap(idParam => {
          if (!idParam) {
            this.startNew();
            return of(null);
          }

          const productId = Number(idParam);
          if (Number.isNaN(productId)) {
            this.error = 'Invalid product id.';
            return of(null);
          }

          return this.loadProduct(productId);
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
    this.productForm.reset({
      productName: '',
      description: '',
      productImage: ''
    });

    this.imagePreviewUrl = '';
    this.skus = [];
    this.resetSkuForm();
  }

  loadProduct(productId: number) {
    this.loading = true;
    this.error = '';
    this.skuError = '';
    this.resetSkuForm();

    return this.productService.getProduct(productId).pipe(
      tap(product => {
        this.productId = product.id;
        this.productMode = 'edit';

        this.productForm.reset({
          productName: product.productName ?? '',
          description: product.description ?? '',
          productImage: product.productImage ?? ''
        });

        this.imagePreviewUrl = this.resolveImage(product.productImage ?? '');
      }),
      tap(product => {
        this.loadSkus(product.id).subscribe();
      }),
      catchError(err => {
        this.error = err?.error ?? 'Unable to load product';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const formValue = this.productForm.getRawValue();
    const payload = {
      productName: formValue.productName,
      description: formValue.description,
      productImage: formValue.productImage,
      tenantid: this.tenantId
    };

    const request$ = !this.productId
      ? this.productService.createProduct(payload)
      : this.productService.updateProduct(this.productId, payload);

    request$
      .pipe(
        tap(product => {
          if (!this.productId) {
            this.router.navigate(['/main/stock-details', product.id]);
            return;
          }

          this.productForm.patchValue({
            productName: product.productName ?? '',
            description: product.description ?? '',
            productImage: product.productImage ?? ''
          });

          this.imagePreviewUrl = this.resolveImage(product.productImage ?? '');
        }),
        catchError(err => {
          this.saveError =
            err?.error ??
            (!this.productId ? 'Unable to create product' : 'Unable to update product');
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

  handleSkuImageUpload(event: Event): void {
    const input = (event.currentTarget ?? event.target) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    this.skuImageUploading = true;
    this.skuImageUploadError = '';

    this.productService.uploadProductImage(file)
      .pipe(
        tap(res => {
          const path = res.path ?? '';
          this.skuForm.patchValue({ image: path });
          this.skuImagePreviewUrl = this.resolveImage(path);
        }),
        catchError(err => {
          this.skuImageUploadError = err?.error?.error ?? err?.error ?? 'Unable to upload SKU image';
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

  resolveImage(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }

  // =========================
  // SKU
  // =========================
  loadSkus(productId: number) {
    this.skuLoading = true;
    this.skuError = '';

    return this.productService.listSkus(productId).pipe(
      tap(skus => (this.skus = skus ?? [])),
      catchError(err => {
        this.skuError = err?.error ?? 'Unable to load SKUs';
        return of(null);
      }),
      finalize(() => {
        this.skuLoading = false;
      })
    );
  }

  openAddSku(): void {
    this.resetSkuForm();
  }

  openEditSku(sku: ProductSku): void {
    this.skuMode = 'edit';
    this.selectedSku = sku;
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

    const formValue = this.skuForm.getRawValue();
    const payload = {
      skuCode: formValue.skuCode,
      colour: formValue.colour,
      size: formValue.size,
      quantityAvailable: Number(formValue.quantityAvailable ?? 0),
      image: formValue.image,
      tenantID: this.tenantId
    };

    if (this.skuMode === 'add') {
      this.productService.createSku(this.productId, payload).subscribe(created => {
        this.skus = [created, ...this.skus];
        this.resetSkuForm();
      });
      return;
    }

    if (!this.selectedSku?.id) return;

    this.productService.updateSku(this.selectedSku.id, payload).subscribe(updated => {
      this.skus = this.skus.map(s => (s.id === updated.id ? updated : s));
      this.selectedSku = updated;
      this.skuImagePreviewUrl = this.resolveImage(updated.image ?? '');
    });
  }

  resetSkuForm(): void {
    this.skuMode = 'add';
    this.selectedSku = null;
    this.skuImagePreviewUrl = '';
    this.skuForm.reset({
      skuCode: '',
      colour: '',
      size: '',
      quantityAvailable: 0,
      image: ''
    });
  }

  // =========================
  // NAV
  // =========================
  goBack(): void {
    this.router.navigate(['/main/stock-details']);
  }
}
