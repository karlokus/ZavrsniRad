import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { ChangePasswordDto, SignInDto, SignUpDto, TokenPair, User } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(AuthStateService);

  signIn(dto: SignInDto): Observable<TokenPair> {
    return this.http
      .post<TokenPair>('/auth/sign-in', dto)
      .pipe(tap((pair) => this.state.setTokens(pair)));
  }

  signUp(dto: SignUpDto): Observable<TokenPair> {
    return this.http
      .post<TokenPair>('/auth/sign-up', dto)
      .pipe(tap((pair) => this.state.setTokens(pair)));
  }

  refresh(): Observable<TokenPair> {
    const refreshToken = this.state.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Missing refresh token'));
    }
    return this.http
      .post<TokenPair>('/auth/refresh-tokens', { refreshToken })
      .pipe(tap((pair) => this.state.setTokens(pair)));
  }

  loadMe(): Observable<User> {
    return this.http.get<User>('/users/me').pipe(tap((user) => this.state.setUser(user)));
  }

  changePassword(dto: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>('/users/change-password', dto);
  }

  signOut(): void {
    this.state.signOut();
  }
}
