import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DemandesAchatService } from '../../core/services/demandes-achat.service';
import { ArticlesService } from '../../core/services/articles.service';
import { Article } from '../../core/models/article.model';

interface LineDraft {
  /** Article Sage sélectionné. */
  articleReference: string;
  designation: string;
  quantite: number;
  /** true = ligne « nouvel article » (désignation seule). */
  isNew: boolean;
  stockDisponible?: number | null;
}

@Component({
  selector: 'app-demande-achat-form',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './demande-achat-form.component.html',
  styleUrl: './demande-achat-form.component.scss',
})
export class DemandeAchatFormComponent {
  private readonly api = inject(DemandesAchatService);
  private readonly articlesApi = inject(ArticlesService);
  private readonly router = inject(Router);

  private readonly articleSearch$ = new Subject<string>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly articleHits = signal<Article[]>([]);

  note = '';
  lines: LineDraft[] = [];
  articleQuery = '';

  constructor() {
    this.articleSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.searchArticles(q));
  }

  onArticleType(): void {
    this.articleSearch$.next(this.articleQuery.trim());
  }

  pickArticle(a: Article): void {
    this.lines = [
      ...this.lines,
      {
        articleReference: a.reference,
        designation: a.designation || a.reference,
        quantite: 1,
        isNew: false,
        stockDisponible: a.stockDisponible ?? null,
      },
    ];
    this.articleQuery = '';
    this.articleHits.set([]);
  }

  /** Article inexistant : ajouter une ligne désignation seule. */
  addNewDesignation(): void {
    const des = this.articleQuery.trim();
    if (!des) {
      this.error.set('Saisissez une désignation pour le nouvel article.');
      return;
    }
    this.lines = [
      ...this.lines,
      {
        articleReference: '',
        designation: des,
        quantite: 1,
        isNew: true,
        stockDisponible: null,
      },
    ];
    this.articleQuery = '';
    this.articleHits.set([]);
    this.error.set(null);
  }

  removeLine(i: number): void {
    this.lines = this.lines.filter((_, idx) => idx !== i);
  }

  save(): void {
    const lignes = this.lines
      .filter((l) => l.quantite > 0 && (l.articleReference.trim() || l.designation.trim()))
      .map((l) => {
        if (l.isNew || !l.articleReference.trim()) {
          return {
            designation: l.designation.trim(),
            quantite: Number(l.quantite),
          };
        }
        return {
          articleReference: l.articleReference.trim(),
          designation: l.designation.trim() || null,
          quantite: Number(l.quantite),
        };
      });

    if (lignes.length === 0) {
      this.error.set('Ajoutez au moins un article (recherche) ou une nouvelle désignation.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        note: this.note.trim() || null,
        lignes,
      })
      .subscribe({
        next: (detail) => {
          this.saving.set(false);
          void this.router.navigate(['/demandes-achat', detail.entete.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Création impossible');
        },
      });
  }

  private searchArticles(q: string): void {
    if (q.length < 2) {
      this.articleHits.set([]);
      return;
    }
    this.articlesApi.list({ search: q, page: 1, pageSize: 10 }).subscribe({
      next: (data) => this.articleHits.set(data.items ?? []),
      error: () => this.articleHits.set([]),
    });
  }
}
