import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { Client, FactureClient } from '../../../core/models/client.model';
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
  readonly factures = signal<FactureClient[]>([]);

  ngOnInit(): void {
    const numero = this.route.snapshot.paramMap.get('numero');
    if (!numero) {
      void this.router.navigate(['/clients']);
      return;
    }
    this.load(numero);
  }

  load(numero: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientsApi.getByNumero(numero).subscribe({
      next: (data) => {
        this.client.set(data.client);
        this.factures.set(data.dernieresFactures?.items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.message || 'Client introuvable');
      },
    });
  }

  canWrite(): boolean {
    return this.auth.hasRole('Commercial', 'Admin');
  }
}
