import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandesDevisImportService } from '../../core/services/demandes-devis-import.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DemandeDevisImportDetail,
  DemandeDevisImportLigne,
} from '../../core/models/demande-devis-import.model';

const STATUT_LABELS: Record<string, string> = {
  Brouillon: 'Brouillon',
  Envoyee: 'Envoyée',
  ReponseRecue: 'Réponse reçue',
  Validee: 'Validée',
  Refusee: 'Refusée',
  Annulee: 'Annulée',
};

interface ReponseLigneDraft {
  ligneId: number;
  designation: string;
  quantite: number;
  prixFournisseur: number | null;
  devise: string;
  delai: string;
}

@Component({
  selector: 'app-demande-devis-import-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './demande-devis-import-detail.component.html',
  styleUrl: './demande-devis-import-detail.component.scss',
})
export class DemandeDevisImportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(DemandesDevisImportService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly detail = signal<DemandeDevisImportDetail | null>(null);

  readonly showReponse = signal(false);
  noteFournisseur = '';
  dateValidite = '';
  reponseLignes: ReponseLigneDraft[] = [];

  readonly showRefus = signal(false);
  motifRefus = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      this.error.set('Identifiant manquant');
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Demande introuvable');
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
      default:
        return 'badge--muted';
    }
  }

  canEnvoyer(): boolean {
    return this.detail()?.entete.statut === 'Brouillon';
  }

  canAnnuler(): boolean {
    const s = this.detail()?.entete.statut;
    return !!s && s !== 'Validee' && s !== 'Annulee';
  }

  canReponse(): boolean {
    if (!this.auth.isAdmin()) return false;
    const s = this.detail()?.entete.statut;
    return s === 'Envoyee' || s === 'ReponseRecue';
  }

  canValider(): boolean {
    return this.auth.isAdmin() && this.detail()?.entete.statut === 'ReponseRecue';
  }

  canRefuser(): boolean {
    if (!this.auth.isAdmin()) return false;
    const s = this.detail()?.entete.statut;
    return !!s && s !== 'Validee' && s !== 'Annulee' && s !== 'Refusee';
  }

  envoyer(): void {
    const d = this.detail();
    if (!d) return;
    if (!confirm(`Envoyer la demande #${d.entete.id} ?`)) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.envoyer(d.entete.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('Demande envoyée');
        this.load(d.entete.id);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.message || 'Envoi impossible');
      },
    });
  }

  annuler(): void {
    const d = this.detail();
    if (!d) return;
    if (!confirm(`Annuler la demande #${d.entete.id} ?`)) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.annuler(d.entete.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('Demande annulée');
        this.load(d.entete.id);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.message || 'Annulation impossible');
      },
    });
  }

  openReponse(): void {
    const d = this.detail();
    if (!d) return;
    this.noteFournisseur = d.entete.noteFournisseur || '';
    this.dateValidite = d.entete.dateValidite
      ? String(d.entete.dateValidite).slice(0, 10)
      : '';
    this.reponseLignes = d.lignes.map((l) => ({
      ligneId: l.id,
      designation: l.designation,
      quantite: l.quantite,
      prixFournisseur: l.prixFournisseur ?? null,
      devise: l.devise || 'EUR',
      delai: l.delai || '',
    }));
    this.showReponse.set(true);
    this.error.set(null);
    this.success.set(null);
  }

  closeReponse(): void {
    this.showReponse.set(false);
  }

  submitReponse(): void {
    const d = this.detail();
    if (!d) return;

    const lignes = this.reponseLignes
      .filter((l) => l.prixFournisseur != null && l.prixFournisseur >= 0)
      .map((l) => ({
        ligneId: l.ligneId,
        prixFournisseur: Number(l.prixFournisseur),
        devise: l.devise.trim() || null,
        delai: l.delai.trim() || null,
      }));

    if (lignes.length === 0) {
      this.error.set('Indiquez au moins un prix fournisseur.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.api
      .reponse(d.entete.id, {
        noteFournisseur: this.noteFournisseur.trim() || null,
        dateValidite: this.dateValidite || null,
        lignes,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.showReponse.set(false);
          this.success.set('Réponse fournisseur enregistrée');
          this.load(d.entete.id);
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.message || 'Enregistrement impossible');
        },
      });
  }

  valider(): void {
    const d = this.detail();
    if (!d) return;
    if (!confirm(`Valider la demande import #${d.entete.id} ?`)) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.valider(d.entete.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('Demande validée');
        this.load(d.entete.id);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.message || 'Validation impossible');
      },
    });
  }

  openRefus(): void {
    this.motifRefus = '';
    this.showRefus.set(true);
    this.error.set(null);
  }

  closeRefus(): void {
    this.showRefus.set(false);
  }

  submitRefus(): void {
    const d = this.detail();
    if (!d) return;
    const motif = this.motifRefus.trim();
    if (!motif) {
      this.error.set('Motif de refus obligatoire.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.refuser(d.entete.id, motif).subscribe({
      next: () => {
        this.busy.set(false);
        this.showRefus.set(false);
        this.success.set('Demande refusée');
        this.load(d.entete.id);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.message || 'Refus impossible');
      },
    });
  }
}
