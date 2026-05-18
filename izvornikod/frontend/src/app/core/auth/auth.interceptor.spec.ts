import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from './token-storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let state: AuthStateService;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        // Fake storage so AuthStateService never touches real localStorage.
        {
          provide: TokenStorageService,
          useValue: { read: () => ({ access: null, refresh: null }), write: vi.fn(), clear: vi.fn() },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    state = TestBed.inject(AuthStateService);
  });

  afterEach(() => mock.verify());

  it('attaches the access token as a Bearer header', () => {
    state.setTokens({ accessToken: 'acc', refreshToken: 'ref' });
    http.get('/protected').subscribe();
    const req = mock.expectOne('/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer acc');
    req.flush({});
  });

  it('does NOT attach a Bearer header to auth endpoints', () => {
    state.setTokens({ accessToken: 'acc', refreshToken: 'ref' });
    http.post('/auth/sign-in', {}).subscribe();
    const req = mock.expectOne('/auth/sign-in');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ accessToken: 'a', refreshToken: 'r' });
  });

  it('passes non-401 errors through untouched', () => {
    state.setTokens({ accessToken: 'acc', refreshToken: 'ref' });
    const onError = vi.fn();
    http.get('/x').subscribe({ error: onError });
    mock.expectOne('/x').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('on 401 refreshes the token and retries the original request', () => {
    state.setTokens({ accessToken: 'old', refreshToken: 'ref' });
    const onNext = vi.fn();
    http.get('/data').subscribe({ next: onNext });

    mock.expectOne('/data').flush('unauth', { status: 401, statusText: 'Unauthorized' });

    const refresh = mock.expectOne('/auth/refresh-tokens');
    refresh.flush({ accessToken: 'new', refreshToken: 'ref2' });

    const retried = mock.expectOne('/data');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new');
    retried.flush({ ok: true });

    expect(onNext).toHaveBeenCalledWith({ ok: true });
    expect(state.accessToken()).toBe('new');
  });

  it('triggers only ONE refresh for concurrent 401s and retries both', () => {
    state.setTokens({ accessToken: 'old', refreshToken: 'ref' });
    const aNext = vi.fn();
    const bNext = vi.fn();

    http.get('/a').subscribe({ next: aNext });
    mock.expectOne('/a').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Second request 401s while the refresh is still in flight → it queues.
    http.get('/b').subscribe({ next: bNext });
    mock.expectOne('/b').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Exactly one refresh call serves both.
    mock.expectOne('/auth/refresh-tokens').flush({ accessToken: 'new', refreshToken: 'r2' });

    const retriedA = mock.expectOne('/a');
    const retriedB = mock.expectOne('/b');
    expect(retriedA.request.headers.get('Authorization')).toBe('Bearer new');
    expect(retriedB.request.headers.get('Authorization')).toBe('Bearer new');
    retriedA.flush({ a: 1 });
    retriedB.flush({ b: 1 });

    expect(aNext).toHaveBeenCalledWith({ a: 1 });
    expect(bNext).toHaveBeenCalledWith({ b: 1 });
  });

  it('errors a queued request (does NOT hang) when the refresh fails', () => {
    state.setTokens({ accessToken: 'old', refreshToken: 'ref' });
    const aError = vi.fn();
    const bError = vi.fn();
    const bNext = vi.fn();

    // Leader: 401 → starts the refresh.
    http.get('/a').subscribe({ error: aError });
    mock.expectOne('/a').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Follower: 401 while refreshing → queues on refresh$.
    http.get('/b').subscribe({ next: bNext, error: bError });
    mock.expectOne('/b').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Refresh itself fails — the regression scenario.
    mock
      .expectOne('/auth/refresh-tokens')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // Leader propagates the error and signs out.
    expect(aError).toHaveBeenCalledTimes(1);
    expect(state.accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/sign-in']);

    // The queued request must terminate with an error, not hang forever.
    expect(bError).toHaveBeenCalledTimes(1);
    expect(bNext).not.toHaveBeenCalled();

    // No second refresh, no leaked retry of /b — afterEach mock.verify() also asserts this.
    mock.expectNone('/auth/refresh-tokens');
    mock.expectNone('/b');
  });
});
