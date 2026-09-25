import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FacturesService } from '../../core/services/factures.service';
import { AuthService } from '../../core/services/auth.service';
import { FactureEntete } from '../../core/models/facture.model';

@Component({
  selector: 'app-factures-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './factures-list.component.html',
  styleUrl: './factures-list.component.scss',
})
export class FacturesListComponent implements OnInit {
  private readonly api = inject(FacturesService);
  private readonly auth = inject(AuthService);
  private readonly search$ = new Subject<string>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<FactureEntete[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly pageSize = 25;
  readonly printPiece = signal<string | null>(null);

  search = '';
  aujourdhui = false;
  impayeesOnly = false;
  /** Commercial : mes FA par défaut ; Admin : tout (peut forcer mes) */
  mesOnly = !this.auth.isAdmin();

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load(1));
  }

  ngOnInit(): void {
    this.load(1);
  }

  onSearch(): void {
    this.search$.next(this.search.trim());
  }

  onFilterChange(): void {
    this.load(1);
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({
        search: this.search.trim() || undefined,
        aujourdhui: this.aujourdhui || undefined,
        impayees: this.impayeesOnly || undefined,
        mes: this.mesOnly,
        page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (data) => {
          this.items.set(data.items ?? []);
          this.total.set(data.total ?? 0);
          this.page.set(data.page ?? page);
          this.totalPages.set(data.totalPages ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.message || 'Erreur chargement factures');
        },
      });
  }

  imprimer(ev: Event, piece: string): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!piece || this.printPiece()) return;
    this.printPiece.set(piece);
    this.error.set(null);
    this.api.imprimer(piece).subscribe({
      next: (blob) => {
        this.api.openPrint(blob);
        this.printPiece.set(null);
        // Marquer déjà imprimée en local
        this.items.update((list) =>
          list.map((f) => (f.numeroPiece === piece ? { ...f, dejaImprimee: true } : f))
        );
      },
      error: (err) => {
        this.printPiece.set(null);
        this.error.set(err?.message || 'Impression impossible');
      },
    });
  }
}
