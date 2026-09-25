import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';

const SIDEBAR_KEY = 'manoha.sidebar.collapsed';
const MQ_DESKTOP = '(min-width: 960px)';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly appName = environment.appName;

  /** Desktop : sidebar réduite (icônes). */
  readonly collapsed = signal(this.readCollapsed());
  /** Mobile / tablette : tiroir ouvert. */
  readonly mobileOpen = signal(false);
  /** true si viewport ≥ 960px. */
  readonly isDesktop = signal(typeof window !== 'undefined' && window.matchMedia(MQ_DESKTOP).matches);

  private navSub?: Subscription;
  private mq?: MediaQueryList;
  private mqHandler?: (e: MediaQueryListEvent) => void;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.mq = window.matchMedia(MQ_DESKTOP);
      this.mqHandler = (e) => {
        this.isDesktop.set(e.matches);
        if (e.matches) this.mobileOpen.set(false);
        this.syncBodyScroll();
      };
      this.mq.addEventListener('change', this.mqHandler);
      this.isDesktop.set(this.mq.matches);
    }

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileOpen.set(false);
        this.syncBodyScroll();
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    if (this.mq && this.mqHandler) {
      this.mq.removeEventListener('change', this.mqHandler);
    }
    document.body.classList.remove('shell-nav-open');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileOpen()) {
      this.closeMobile();
    }
  }

  toggleSidebar(): void {
    if (this.isDesktop()) {
      const next = !this.collapsed();
      this.collapsed.set(next);
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
    } else {
      this.mobileOpen.update((v) => !v);
      this.syncBodyScroll();
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
    this.syncBodyScroll();
  }

  logout(): void {
    this.auth.logout();
  }

  private syncBodyScroll(): void {
    if (typeof document === 'undefined') return;
    if (this.mobileOpen() && !this.isDesktop()) {
      document.body.classList.add('shell-nav-open');
    } else {
      document.body.classList.remove('shell-nav-open');
    }
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  }
}
