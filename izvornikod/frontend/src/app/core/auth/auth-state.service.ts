import { computed, inject, Injectable, signal } from '@angular/core';
import { TokenPair, User } from './auth.types';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly storage = inject(TokenStorageService);

  private readonly initial = this.storage.read();
  readonly accessToken = signal<string | null>(this.initial.access);
  readonly refreshToken = signal<string | null>(this.initial.refresh);
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.accessToken());

  setTokens(pair: TokenPair): void {
    this.accessToken.set(pair.accessToken);
    this.refreshToken.set(pair.refreshToken);
    this.storage.write(pair);
  }

  setUser(user: User | null): void {
    this.currentUser.set(user);
  }

  signOut(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
    this.storage.clear();
  }
}
