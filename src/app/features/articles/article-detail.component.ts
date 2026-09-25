import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ArticlesService } from '../../core/services/articles.service';
import { Article, ArticleStockDepot } from '../../core/models/article.model';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
})
export class ArticleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articlesApi = inject(ArticlesService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly article = signal<Article | null>(null);
  readonly stocks = signal<ArticleStockDepot[]>([]);
  readonly stockTotal = signal(0);
  readonly stockReserve = signal(0);
  readonly stockCommande = signal(0);
  readonly stockDisponible = signal(0);

  ngOnInit(): void {
    const reference = this.route.snapshot.paramMap.get('reference');
    if (!reference) {
      void this.router.navigate(['/articles']);
      return;
    }
    this.load(reference);
  }

  load(reference: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.articlesApi.getByReference(reference).subscribe({
      next: (data) => {
        this.article.set(data.article);
        this.stocks.set(data.stocksParDepot ?? []);
        this.stockTotal.set(data.stockTotal ?? 0);
        this.stockReserve.set(data.stockReserve ?? 0);
        this.stockCommande.set(data.stockCommande ?? 0);
        this.stockDisponible.set(data.stockDisponible ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'Article introuvable');
      },
    });
  }
}
