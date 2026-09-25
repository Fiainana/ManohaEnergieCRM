import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandesAchatService } from '../../core/services/demandes-achat.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DemandeAchatDetail,
  DemandeAchatLigne,
} from '../../core/models/demande-achat.model';

@Component({
  selector: 'app-demande-achat-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './demande-achat-detail.component.html',
  styleUrl: './demande-achat-detail.component.scss',
})
export class DemandeAchatDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(DemandesAchatService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly detail = signal<DemandeAchatDetail | null>(null);

  /** Ligne en cours d'édition article (Admin). */
  articleLigneId: number | null = null;
  articleForm = {
    articleReference: '',
    designation: '',
    prixAchat: 0,
    prixVente: null as number | null,
    codeFamille: '',
    suiviStock: true,
    rattacherSiExiste: true,
  };

  depotNo: number | null = null;

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

  canAnnuler(): boolean {
    const s = this.detail()?.entete.statut;
    if (!s) return false;
    return !['Annulee', 'Cloturee', 'CommandeSageCreee', 'Receptionnee', 'Facturable'].includes(s);
  }

  canGenererSage(): boolean {
    return this.auth.isAdmin() && this.detail()?.entete.statut === 'ArticlePret';
  }

  openArticleForm(l: DemandeAchatLigne): void {
    this.articleLigneId = l.id;
    this.articleForm = {
      articleReference: l.articleSage || l.refFournisseur || '',
      designation: '',
      prixAchat: 0,
      prixVente: null,
      codeFamille: '',
      suiviStock: true,
      rattacherSiExiste: true,
    };
    this.error.set(null);
    this.success.set(null);
  }

  closeArticleForm(): void {
    this.articleLigneId = null;
  }

  submitArticle(): void {
    const d = this.detail();
    if (!d || this.articleLigneId == null) return;

    const ref = this.articleForm.articleReference.trim();
    if (!ref) {
      this.error.set('Référence article Sage obligatoire.');
      return;
    }
    if (this.articleForm.prixAchat < 0) {
      this.error.set('Prix d\'achat invalide.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.api
      .creerArticle(d.entete.id, this.articleLigneId, {
        articleReference: ref,
        designation: this.articleForm.designation.trim() || null,
        prixAchat: Number(this.articleForm.prixAchat),
        prixVente:
          this.articleForm.prixVente != null && this.articleForm.prixVente !== ('' as unknown)
            ? Number(this.articleForm.prixVente)
            : null,
        codeFamille: this.articleForm.codeFamille.trim() || null,
        suiviStock: this.articleForm.suiviStock,
        rattacherSiExiste: this.articleForm.rattacherSiExiste,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.articleLigneId = null;
          this.success.set('Article créé / rattaché');
          this.load(d.entete.id);
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.message || 'Création article impossible');
        },
      });
  }

  genererSage(): void {
    const d = this.detail();
    if (!d) return;
    const depot = Number(this.depotNo);
    if (!depot || depot < 1) {
      this.error.set('Indiquez le n° de dépôt Sage (DE_No).');
      return;
    }
    if (!confirm(`Générer le BC fournisseur Sage sur le dépôt ${depot} ?`)) return;

    this.busy.set(true);
    this.error.set(null);
    this.api.genererSage(d.entete.id, { depotNo: depot }).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('BC fournisseur créé dans Sage');
        this.load(d.entete.id);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.message || 'Génération Sage impossible');
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
      default:
        return 'badge--muted';
    }
  }
}
