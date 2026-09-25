import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ClientsService } from '../../../core/services/clients.service';
import { Client } from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
  private readonly clientsApi = inject(ClientsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private readonly search$ = new Subject<string>();

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<Client[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly page = signal(1);
  readonly hasMore = signal(false);
  readonly pageSize = 25;

  search = '';
  ville = '';
  inclureSommeil = false;

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.reload());

    afterNextRender(() => this.setupObserver());
  }

  ngOnInit(): void {
    this.reload();
  }

  onSearchInput(): void {
    this.search$.next(`${this.search.trim()}|${this.ville.trim()}|${this.inclureSommeil}`);
  }

  onSommeilChange(): void {
    this.reload();
  }

  reload(): void {
    this.load(1, false);
  }

  loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    this.load(this.page() + 1, true);
  }

  clearFilters(): void {
    this.search = '';
    this.ville = '';
    this.inclureSommeil = false;
    this.reload();
  }

  initials(client: Client): string {
    const raw = (client.intitule || client.numero || '?').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  canWrite(): boolean {
    return this.auth.hasRole('Commercial', 'Admin');
  }

  private load(page: number, append: boolean): void {
    if (append) this.loadingMore.set(true);
    else this.loading.set(true);
    this.error.set(null);

    this.clientsApi
      .list({
        search: this.search.trim() || undefined,
        ville: this.ville.trim() || undefined,
        page,
        pageSize: this.pageSize,
        inclureSommeil: this.inclureSommeil || undefined,
      })
      .subscribe({
        next: (data) => {
          const nextItems = data.items ?? [];
          this.items.set(append ? [...this.items(), ...nextItems] : nextItems);
          this.total.set(data.total ?? 0);
          this.totalPages.set(data.totalPages ?? 0);
          this.page.set(data.page ?? page);
          const loaded = this.items().length;
          this.hasMore.set(
            loaded < (data.total ?? 0) && (data.page ?? page) < (data.totalPages ?? 0)
          );
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadingMore.set(false);
          this.error.set(
            err?.error?.message || err?.message || 'Erreur lors du chargement des clients'
          );
        },
      });
  }

  private setupObserver(): void {
    this.observer?.disconnect();
    const el = this.sentinel()?.nativeElement;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) this.loadMore();
      },
      { root: null, rootMargin: '240px', threshold: 0 }
    );
    this.observer.observe(el);
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }
}
