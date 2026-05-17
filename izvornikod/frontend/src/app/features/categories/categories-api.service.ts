import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryDto, UpdateCategoryDto } from './category.types';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>('/categories');
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>('/categories', dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`/categories/${id}`, dto);
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`/categories/${id}`);
  }
}
