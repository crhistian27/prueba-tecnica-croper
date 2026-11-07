import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Paginated, Product, ProductInput, ProductQuery } from '../../../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/products`;

  list(query: ProductQuery): Observable<Paginated<Product>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('sortBy', query.sortBy)
      .set('order', query.order);
    if (query.search.trim()) params = params.set('search', query.search.trim());
    if (query.category) params = params.set('category', query.category);
    return this.http.get<Paginated<Product>>(this.url, { params });
  }

  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.url, input);
  }

  update(id: string, changes: Partial<ProductInput>): Observable<Product> {
    return this.http.patch<Product>(`${this.url}/${id}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
