import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product';
import { SessionService } from '../../../../services/session';
import { Product } from './product.model';
import { ProductEditor } from './product-editor/product-editor';
import { BehaviorSubject, Observable, catchError, combineLatest, finalize, map, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-stock-details',
  imports: [CommonModule, ProductEditor],
  templateUrl: './stock-details.html',
  styleUrl: './stock-details.scss'
})
export class StockDetails implements OnInit {

  products$!: Observable<Product[]>;
  filteredProducts$!: Observable<Product[]>;
  loading = false;
  error = '';
  tenantId = 0;
  editorOpen = false;
  editorProductId: number | null = null;
  private searchTerm$ = new BehaviorSubject<string>('');

  constructor(
    private productService: ProductService,
    private session: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const tenant = this.session.value?.tenantID ?? 0;

    this.tenantId = tenant;
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.products$ = this.productService.listProducts(this.tenantId).pipe(
      map((products) => {
        const list = Array.isArray(products) ? products : [];
        return list.map((product) => this.toProduct(product));
      }),
      catchError((err) => {
        this.error = err?.error ?? 'Unable to load products';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );

    this.filteredProducts$ = combineLatest([this.products$, this.searchTerm$]).pipe(
      map(([products, term]) => this.filterProducts(products, term))
    );
  }

  private toProduct(product: Product): Product {
    return {
      id: product?.id ?? 0,
      productName: product?.productName ?? '',
      description: product?.description ?? null,
      productImage: product?.productImage ?? null,
      createdBy: product?.createdBy ?? null,
      tenantid: product?.tenantid ?? product?.tenantID ?? null,
      tenantID: product?.tenantID ?? product?.tenantid ?? null
    };
  }

  openAddProduct(): void {
    this.editorProductId = null;
    this.editorOpen = true;
  }

  openEditProduct(product: Product): void {
    this.editorProductId = product.id;
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.editorProductId = null;
  }

  handleProductSaved(): void {
    this.loadProducts();
  }

  resolveImage(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `http://localhost:8080${path}`;
  }

  updateSearch(term: string): void {
    this.searchTerm$.next(term ?? '');
  }

  private filterProducts(products: Product[], term: string): Product[] {
    const query = (term ?? '').toLowerCase().trim();
    if (!query) return products;
    return products.filter(product => {
      const name = (product.productName ?? '').toLowerCase();
      const desc = (product.description ?? '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }
}
