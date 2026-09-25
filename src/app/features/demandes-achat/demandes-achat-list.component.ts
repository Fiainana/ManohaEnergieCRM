import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandesAchatService } from '../../core/services/demandes-achat.service';
import { AuthService } from '../../core/services/auth.service';
import { DemandeAchatEntete } from '../../core/models/demande-achat.model';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EnAttenteArticle', label: 'En attente article' },
  { value: 'ArticlePret', label: 'Article prêt' },
  { value: 'CommandeSageCreee', label: 'Commande Sage' },
  { value: 'Receptionnee', label: 'Réceptionnée' },
  { value: 'Facturable', label: 'Facturable' },
  { value: 'Cloturee', label: 'Clôturée' },
  { value: 'Annulee', label: 'Annulée' },
];

@Component({
  selector: 'app-demandes-achat-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './demandes-achat-list.component.html',
  styleUrl: './demandes-achat-list.component.scss',
})
export class DemandesAchatListComponent implements OnInit {
  private readonly api = inject(DemandesAchatService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<DemandeAchatEntete[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly pageSize = 25;

  readonly statuts = STATUTS;
  statut = '';
  /** Admin : voir toutes les demandes (sinon = mes demandes). */
  scopeAll = false;

  ngOnInit(): void {
    if (this.auth.isAdmin()) this.scopeAll = true;
    this.load(1);
  }

  onFilterChange(): void {
    this.load(1);
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);

    const opts = {
      statut: this.statut || undefined,
      page,
      pageSize: this.pageSize,
    };

    const req$ =
      this.auth.isAdmin() && this.scopeAll ? this.api.listAll(opts) : this.api.listMes(opts);

    req$.subscribe({
      next: (data) => {
        this.items.set(data.items ?? []);
        this.total.set(data.total ?? 0);
        this.page.set(data.page ?? page);
        this.totalPages.set(data.totalPages ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Erreur chargement');
      },
    });
  }

  statutClass(s: string): string {
    switch (s) {
      case 'EnAttenteArticle':
        return 'badge--warn';
      case 'ArticlePret':
        return 'badge--info';
      case 'CommandeSageCreee':
      case 'Receptionnee':
      case 'Facturable':
        return 'badge--ok';
      case 'Annulee':
        return 'badge--muted';
      case 'Cloturee':
        return 'badge--muted';
      default:
        return 'badge--muted';
    }
  }
}
