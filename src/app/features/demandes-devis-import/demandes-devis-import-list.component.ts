import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandesDevisImportService } from '../../core/services/demandes-devis-import.service';
import { AuthService } from '../../core/services/auth.service';
import { DemandeDevisImportEntete } from '../../core/models/demande-devis-import.model';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'Brouillon', label: 'Brouillon' },
  { value: 'Envoyee', label: 'Envoyée' },
  { value: 'ReponseRecue', label: 'Réponse reçue' },
  { value: 'Validee', label: 'Validée' },
  { value: 'Refusee', label: 'Refusée' },
  { value: 'Annulee', label: 'Annulée' },
];

const STATUT_LABELS: Record<string, string> = {
  Brouillon: 'Brouillon',
  Envoyee: 'Envoyée',
  ReponseRecue: 'Réponse reçue',
  Validee: 'Validée',
  Refusee: 'Refusée',
  Annulee: 'Annulée',
};

@Component({
  selector: 'app-demandes-devis-import-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './demandes-devis-import-list.component.html',
  styleUrl: './demandes-devis-import-list.component.scss',
})
export class DemandesDevisImportListComponent implements OnInit {
  private readonly api = inject(DemandesDevisImportService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<DemandeDevisImportEntete[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly pageSize = 25;

  readonly statuts = STATUTS;
  statut = '';
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

  statutLabel(s: string): string {
    return STATUT_LABELS[s] || s;
  }

  statutClass(s: string): string {
    switch (s) {
      case 'Brouillon':
        return 'badge--muted';
      case 'Envoyee':
        return 'badge--info';
      case 'ReponseRecue':
        return 'badge--warn';
      case 'Validee':
        return 'badge--ok';
      case 'Refusee':
      case 'Annulee':
        return 'badge--muted';
      default:
        return 'badge--muted';
    }
  }
}
