import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevisService } from '../../core/services/devis.service';
import { ClientsService } from '../../core/services/clients.service';
import { ArticlesService } from '../../core/services/articles.service';
import { AuthService } from '../../core/services/auth.service';
import { Client } from '../../core/models/client.model';
import { Article } from '../../core/models/article.model';
import { DevisLignePayload } from '../../core/models/devis.model';

interface LineDraft {
  articleReference: string;
  designation: string;
  quantite: number;
  prixUnitaire: number | null;
  remise: number | null;
  montantTTC: number | null;
  stockDisponible?: number | null;
}

@Component({
  selector: 'app-devis-form',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './devis-form.component.html',
  styleUrl: './devis-form.component.scss',
})
export class DevisFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly devisApi = inject(DevisService);
  private readonly clientsApi = inject(ClientsService);
  private readonly articlesApi = inject(ArticlesService);
  private readonly auth = inject(AuthService);
  private readonly tva = 0.2;

  private readonly clientSearch$ = new Subject<string>();
  private readonly articleSearch$ = new Subject<string>();

  readonly isNew = signal(true);
  readonly piece = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedTotalTtc = signal<number | null>(null);

  clientNumero = '';
  clientLabel = '';
  reference = '';
  date = new Date().toISOString().slice(0, 10);
  lines: LineDraft[] = [];

  clientQuery = '';
  articleQuery = '';
  readonly clientHits = signal<Client[]>([]);
  readonly articleHits = signal<Article[]>([]);
  readonly showCreateClient = signal(false);
  readonly creatingClient = signal(false);
  readonly createClientError = signal<string | null>(null);

  newClient = {
    intitule: '',
    telephone: '',
    email: '',
    adresse: '',
    complement: '',
    codePostal: '',
    ville: '',
    pays: 'Madagascar',
  };

  constructor() {
    this.clientSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.searchClients(q));
    this.articleSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.searchArticles(q));
  }

  ngOnInit(): void {
    const piece = this.route.snapshot.paramMap.get('numeroPiece');
    if (!piece || piece === 'nouveau') {
      this.isNew.set(true);
      this.addLine();
      return;
    }
    this.isNew.set(false);
    this.piece.set(piece);
    this.load(piece);
  }

  load(piece: string): void {
    this.loading.set(true);
    this.devisApi.get(piece).subscribe({
      next: (data) => {
        this.clientNumero = data.entete.clientNumero || '';
        this.clientLabel = data.entete.clientIntitule || this.clientNumero;
        this.reference = data.entete.reference || '';
        this.date = data.entete.dateDocument ? String(data.entete.dateDocument).slice(0, 10) : this.date;
        this.savedTotalTtc.set(data.entete.totalTTC ?? data.entete.netAPayer ?? null);
        this.lines = (data.lignes || []).map((l) => ({
          articleReference: l.articleReference,
          designation: l.designation || l.articleReference,
          quantite: l.quantite || 1,
          prixUnitaire: l.prixUnitaire ?? null,
          remise: l.remisePourcent ?? null,
          montantTTC: l.montantTTC ?? null,
          stockDisponible: null,
        }));
        if (this.lines.length === 0) this.addLine();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Devis introuvable');
      },
    });
  }

  onClientType(): void {
    this.showCreateClient.set(false);
    this.createClientError.set(null);
    this.clientSearch$.next(this.clientQuery.trim());
  }

  onArticleType(): void {
    this.articleSearch$.next(this.articleQuery.trim());
  }

  pickClient(c: Client): void {
    this.clientNumero = c.numero;
    this.clientLabel = c.intitule;
    this.clientQuery = '';
    this.clientHits.set([]);
    this.showCreateClient.set(false);
  }

  openCreateClient(): void {
    this.newClient = {
      intitule: this.clientQuery.trim(),
      telephone: '',
      email: '',
      adresse: '',
      complement: '',
      codePostal: '',
      ville: '',
      pays: 'Madagascar',
    };
    this.createClientError.set(null);
    this.showCreateClient.set(true);
    this.clientHits.set([]);
  }

  closeCreateClient(): void {
    this.showCreateClient.set(false);
    this.createClientError.set(null);
  }

  createClientQuick(): void {
    const intitule = this.newClient.intitule.trim();
    if (!intitule) {
      this.createClientError.set("L'intitulé est obligatoire.");
      return;
    }
    this.creatingClient.set(true);
    this.createClientError.set(null);

    const sageMatricule = this.auth.user()?.sageMatricule?.trim() || null;

    this.clientsApi
      .create({
        intitule,
        telephone: this.newClient.telephone.trim() || null,
        email: this.newClient.email.trim() || null,
        adresse: this.newClient.adresse.trim() || null,
        complement: this.newClient.complement.trim() || null,
        codePostal: this.newClient.codePostal.trim() || null,
        ville: this.newClient.ville.trim() || null,
        pays: this.newClient.pays.trim() || null,
        representantCode: sageMatricule,
      })
      .subscribe({
        next: (created) => {
          this.creatingClient.set(false);
          this.pickClient(created);
          this.showCreateClient.set(false);
        },
        error: (err) => {
          this.creatingClient.set(false);
          this.createClientError.set(err?.message || 'Création du client impossible');
        },
      });
  }

  pickArticle(a: Article): void {
    const empty = this.lines.find((l) => !l.articleReference);
    const line: LineDraft = {
      articleReference: a.reference,
      designation: a.designation || a.reference,
      quantite: 1,
      prixUnitaire: a.prixVente ?? null,
      remise: null,
      montantTTC: null,
      stockDisponible: a.stockDisponible ?? null,
    };
    if (empty) Object.assign(empty, line);
    else this.lines = [...this.lines, line];
    this.articleQuery = '';
    this.articleHits.set([]);
  }

  addLine(): void {
    this.lines = [
      ...this.lines,
      {
        articleReference: '',
        designation: '',
        quantite: 1,
        prixUnitaire: null,
        remise: null,
        montantTTC: null,
        stockDisponible: null,
      },
    ];
  }

  removeLine(i: number): void {
    this.lines = this.lines.filter((_, idx) => idx !== i);
    if (this.lines.length === 0) this.addLine();
  }

  lineTtc(l: LineDraft): number {
    if (l.montantTTC != null && Number(l.quantite) && l.montantTTC > 0) {
      return Number(l.montantTTC);
    }
    const q = Number(l.quantite) || 0;
    const p = Number(l.prixUnitaire) || 0;
    const r = Number(l.remise) || 0;
    const ht = q * p * (1 - r / 100);
    return ht * (1 + this.tva);
  }

  totalTtc(): number {
    if (this.savedTotalTtc() != null && this.lines.every((l) => l.montantTTC != null || !l.articleReference)) {
      return this.savedTotalTtc() as number;
    }
    return this.lines.reduce((s, l) => s + this.lineTtc(l), 0);
  }

  payloadLines(): DevisLignePayload[] {
    return this.lines
      .filter((l) => l.articleReference.trim() && Number(l.quantite) > 0)
      .map((l) => {
        const row: DevisLignePayload = {
          articleReference: l.articleReference.trim(),
          quantite: Number(l.quantite),
        };
        const remise = Number(l.remise);
        if (remise > 0) row.remise = remise;
        return row;
      });
  }

  save(): void {
    const lignes = this.payloadLines();
    if (!this.clientNumero) {
      this.error.set('Choisissez un client.');
      return;
    }
    if (lignes.length === 0) {
      this.error.set('Ajoutez au moins une ligne article.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const body = {
      clientNumero: this.clientNumero.trim(),
      ...(this.reference.trim() ? { reference: this.reference.trim() } : {}),
      ...(this.date ? { date: this.date } : {}),
      lignes,
    };

    if (this.isNew()) {
      this.devisApi.create(body).subscribe({
        next: (piece) => {
          this.saving.set(false);
          if (piece) void this.router.navigate(['/devis', piece]);
          else void this.router.navigate(['/devis']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Enregistrement impossible');
        },
      });
    } else {
      const piece = this.piece();
      if (!piece) return;
      this.devisApi
        .update(piece, {
          ...(this.reference.trim() ? { reference: this.reference.trim() } : { reference: '' }),
          ...(this.date ? { date: this.date } : {}),
          lignes,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.load(piece);
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err?.message || 'Enregistrement impossible');
          },
        });
    }
  }

  facturer(): void {
    const piece = this.piece();
    if (!piece) return;
    this.saving.set(true);
    this.devisApi.facturer(piece).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/devis']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.message || 'Facturation impossible');
      },
    });
  }

  cancel(): void {
    const piece = this.piece();
    if (!piece) return;
    if (!confirm('Annuler ce devis ?')) return;
    this.devisApi.cancel(piece).subscribe({
      next: () => void this.router.navigate(['/devis']),
      error: (err) => this.error.set(err?.message || 'Annulation impossible'),
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
