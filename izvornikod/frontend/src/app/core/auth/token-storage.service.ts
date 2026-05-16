import { Injectable } from '@angular/core';
import { TokenPair } from './auth.types';

const ACCESS_KEY = 'metronoma.access';
const REFRESH_KEY = 'metronoma.refresh';

export interface StoredTokens {
  access: string | null;
  refresh: string | null;
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  read(): StoredTokens {
    if (typeof localStorage === 'undefined') return { access: null, refresh: null };
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
    };
  }

  write(pair: TokenPair): void {
    localStorage.setItem(ACCESS_KEY, pair.accessToken);
    localStorage.setItem(REFRESH_KEY, pair.refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
