import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DemandesDevisImportService } from '../../core/services/demandes-devis-import.service';
import { ClientsService } from '../../core/services/clients.service';
import { Client } from '../../core/models/client.model';

interface LineDraft {
  designation: string;
  refFournisseur: string;
  quantite: number;
  prixEstime: number | null;
  devise: string;
}

@Component({
  selector: 'app-demande-devis-import-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './demande-devis-import-form.component.html',
  styleUrl: './demande-devis-import-form.component.scss',
})
export class DemandeDevisImportFormComponent {
  private readonly api = inject(DemandesDevisImportService);
  private readonly clientsApi = inject(ClientsService);
  private readonly router = inject(Router);

  private readonly clientSearch$ = new Subject<string>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly clientHits = signal<Client[]>([]);

  /** N° Sage sélectionné (ou texte libre) */
  clientNumero = '';
  /** Libellé affiché quand un client Sage est choisi */
  clientLabel = '';
  clientQuery = '';

  fournisseur = '';
  paysOrigine = '';
  note = '';
  lines: LineDraft[] = [
    { designation: '', refFournisseur: '', quantite: 1, prixEstime: null, devise: 'EUR' },
  ];

  constructor() {
    this.clientSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.searchClients(q));
  }

  onClientType(): void {
    // Saisie libre : on garde ce que l'utilisateur tape comme valeur envoyée
    this.clientNumero = this.clientQuery.trim();
    this.clientLabel = '';
    this.clientSearch$.next(this.clientQuery.trim());
  }

  pickClient(c: Client): void {
    this.clientNumero = c.numero;
    this.clientLabel = c.intitule;
    this.clientQuery = '';
    this.clientHits.set([]);
  }

  clearClient(): void {
    this.clientNumero = '';
    this.clientLabel = '';
    this.clientQuery = '';
    this.clientHits.set([]);
  }

  /** Utiliser le texte saisi tel quel (client hors Sage) */
  useFreeText(): void {
    const q = this.clientQuery.trim();
    if (!q) return;
    this.clientNumero = q;
    this.clientLabel = q;
    this.clientQuery = '';
    this.clientHits.set([]);
  }

  addLine(): void {
    this.lines = [
      ...this.lines,
      { designation: '', refFournisseur: '', quantite: 1, prixEstime: null, devise: 'EUR' },
    ];
  }

  removeLine(i: number): void {
    this.lines = this.lines.filter((_, idx) => idx !== i);
    if (this.lines.length === 0) this.addLine();
  }

  save(): void {
    const lignes = this.lines
      .filter((l) => l.designation.trim() && Number(l.quantite) > 0)
      .map((l) => ({
        designation: l.designation.trim(),
        refFournisseur: l.refFournisseur.trim() || null,
        quantite: Number(l.quantite),
        prixEstime: l.prixEstime != null && l.prixEstime > 0 ? Number(l.prixEstime) : null,
        devise: l.devise.trim() || null,
      }));

    if (lignes.length === 0) {
      this.error.set('Ajoutez au moins une ligne avec désignation et quantité.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        clientNumero: this.clientNumero.trim() || null,
        fournisseur: this.fournisseur.trim() || null,
        paysOrigine: this.paysOrigine.trim() || null,
        note: this.note.trim() || null,
        lignes,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.id) void this.router.navigate(['/demandes-devis-import', res.id]);
          else void this.router.navigate(['/demandes-devis-import']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Création impossible');
        },
      });
  }

  private searchClients(q: string): void {
    if (q.length < 2) {
      this.clientHits.set([]);
      return;
    }
    this.clientsApi.list({ search: q, page: 1, pageSize: 8 }).subscribe({
      next: (data) => this.clientHits.set(data.items ?? []),
      error: () => this.clientHits.set([]),
    });
  }
}
