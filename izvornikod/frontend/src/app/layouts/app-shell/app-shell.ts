import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * App shell — okvir za prijavljene rute: Sidebar (248px) + Topbar + sadržaj.
 * Layout klase (.app/.main/.content) dolaze iz globalnog styles.css (§9).
 */
@Component({
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {}
