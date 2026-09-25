import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevisService } from '../../core/services/devis.service';
import { AuthService } from '../../core/services/auth.service';
import { DevisEntete } from '../../core/models/devis.model';

@Component({
  selector: 'app-devis-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './devis-list.component.html',
  styleUrl: './devis-list.component.scss',
})
export class DevisListComponent implements OnInit {
  private readonly api = inject(DevisService);
  private readonly auth = inject(AuthService);
  private readonly search$ = new Subject<string>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<DevisEntete[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly pageSize = 25;
  readonly pdfPiece = signal<string | null>(null);
  search = '';

  constructor() {
    this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => this.load(1));
  }

  ngOnInit(): void {
    this.load(1);
  }

  onSearch(): void {
    this.search$.next(this.search.trim());
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({
        search: this.search.trim() || undefined,
        page,
        pageSize: this.pageSize,
        mes: !this.auth.isAdmin(),
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
          this.error.set(err?.message || 'Erreur chargement devis');
        },
      });
  }

  exportPdf(ev: Event, piece: string): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!piece || this.pdfPiece()) return;
    this.pdfPiece.set(piece);
    this.error.set(null);
    this.api.downloadPdf(piece).subscribe({
      next: () => this.pdfPiece.set(null),
      error: (err) => {
        this.pdfPiece.set(null);
        this.error.set(err?.message || 'Export PDF impossible');
      },
    });
  }
}
