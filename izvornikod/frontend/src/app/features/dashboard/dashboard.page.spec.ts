import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard.page';

/**
 * Regression guard for the needs-practice contract: backend
 * (dashboard-stats.provider.ts) returns `compositionId`, NOT `id`.
 * If the type/template drift back to `id`, the rendered links become
 * `/repertoire/undefined` and `@for` track keys collide (NG0955).
 */
describe('DashboardPage — needs-practice contract', () => {
  let mock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    mock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => mock.verify());

  it('links each row to /repertoire/<compositionId> (never undefined)', async () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges(); // ngOnInit fires the HTTP calls

    mock.expectOne('/dashboard/summary').flush({
      totalSongs: 3,
      learnedCount: 1,
      activeStreak: 0,
      upcomingPractices: 0,
    });
    mock.expectOne('/dashboard/needs-practice').flush([
      { compositionId: 'comp-1', title: 'Pjesma A', avgMastery: 2, lastPracticedAt: null },
      { compositionId: 'comp-2', title: 'Pjesma B', avgMastery: 3, lastPracticedAt: null },
    ]);
    // StreakWidget child loads independently.
    mock.expectOne('/practice-plans/streak').flush({
      currentStreak: 0,
      lastCompletedDate: null,
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
      '.practice-row',
    );
    expect(rows.length).toBe(2);
    const hrefs = Array.from(rows).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/repertoire/comp-1', '/repertoire/comp-2']);
    expect(hrefs.some((h) => h?.includes('undefined'))).toBe(false);
  });
});
