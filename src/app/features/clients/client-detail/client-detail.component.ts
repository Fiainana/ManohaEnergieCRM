import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import {
  Client,
  ClientStats,
  DevisClient,
  FactureClient,
} from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsApi = inject(ClientsService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly client = signal<Client | null>(null);
  readonly stats = signal<ClientStats | null>(null);

  readonly factures = signal<FactureClient[]>([]);
  readonly facturesLoading = signal(false);
  readonly facturesError = signal<string | null>(null);
  readonly facturesPage = signal(1);
  readonly facturesTotal = signal(0);
  readonly facturesTotalPages = signal(0);
  readonly impayeesOnly = signal(false);

  readonly devis = signal<DevisClient[]>([]);
  readonly devisLoading = signal(false);
  readonly devisError = signal<string | null>(null);
  readonly devisPage = signal(1);
  readonly devisTotal = signal(0);
  readonly devisTotalPages = signal(0);

  private readonly pageSize = 15;
  private numero = '';

  ngOnInit(): void {
    const numero = this.route.snapshot.paramMap.get('numero');
    if (!numero) {
      void this.router.navigate(['/clients']);
      return;
    }
    this.numero = numero;
    this.load(numero);
  }

  load(numero: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientsApi.getByNumero(numero).subscribe({
      next: (data) => {
        this.client.set(data.client);
        this.stats.set(data.stats ?? null);
        this.loading.set(false);

        // Précharger listes depuis la fiche si présentes, sinon API
        if (data.dernieresFactures?.items?.length) {
          this.factures.set(data.dernieresFactures.items);
          this.facturesTotal.set(data.dernieresFactures.total ?? data.dernieresFactures.items.length);
          this.facturesTotalPages.set(data.dernieresFactures.totalPages ?? 1);
        } else {
          this.loadFactures(1);
        }

        if (data.derniersDevis?.items?.length) {
          this.devis.set(data.derniersDevis.items);
          this.devisTotal.set(data.derniersDevis.total ?? data.derniersDevis.items.length);
          this.devisTotalPages.set(data.derniersDevis.totalPages ?? 1);
        } else {
          this.loadDevis(1);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Client introuvable');
      },
    });
  }

  loadFactures(page = 1): void {
    this.facturesLoading.set(true);
    this.facturesError.set(null);
    this.facturesPage.set(page);

    this.clientsApi.listFactures(this.numero, this.impayeesOnly(), page, this.pageSize).subscribe({
      next: (data) => {
        this.factures.set(data.items ?? []);
        this.facturesTotal.set(data.total ?? 0);
        this.facturesTotalPages.set(data.totalPages ?? 0);
        this.facturesLoading.set(false);
      },
      error: (err) => {
        this.facturesLoading.set(false);
        this.facturesError.set(err?.message || 'Erreur factures');
      },
    });
  }

  loadDevis(page = 1): void {
    this.devisLoading.set(true);
    this.devisError.set(null);
    this.devisPage.set(page);

    this.clientsApi.listDevis(this.numero, page, this.pageSize).subscribe({
      next: (data) => {
        this.devis.set(data.items ?? []);
        this.devisTotal.set(data.total ?? 0);
        this.devisTotalPages.set(data.totalPages ?? 0);
        this.devisLoading.set(false);
      },
      error: (err) => {
        this.devisLoading.set(false);
        this.devisError.set(err?.message || 'Erreur devis');
      },
    });
  }

  toggleImpayees(value: boolean): void {
    this.impayeesOnly.set(value);
    this.loadFactures(1);
  }

  prevFactures(): void {
    if (this.facturesPage() > 1) this.loadFactures(this.facturesPage() - 1);
  }

  nextFactures(): void {
    if (this.facturesPage() < this.facturesTotalPages()) {
      this.loadFactures(this.facturesPage() + 1);
    }
  }

  prevDevis(): void {
    if (this.devisPage() > 1) this.loadDevis(this.devisPage() - 1);
  }

  nextDevis(): void {
    if (this.devisPage() < this.devisTotalPages()) {
      this.loadDevis(this.devisPage() + 1);
    }
  }

  encours(): number {
    return this.client()?.credit?.encours ?? this.client()?.encours ?? 0;
  }

  canWrite(): boolean {
    return this.auth.hasRole('Commercial', 'Admin');
  }
}
