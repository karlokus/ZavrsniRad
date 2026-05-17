import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../core/auth/auth.types';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  instrumentId?: string;
  skillLevel?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<User> {
    return this.http.get<User>('/users/me');
  }

  updateMe(dto: UpdateProfileDto): Observable<User> {
    return this.http.patch<User>('/users/me', dto);
  }

  deleteMe(): Observable<unknown> {
    return this.http.delete('/users/me');
  }
}
