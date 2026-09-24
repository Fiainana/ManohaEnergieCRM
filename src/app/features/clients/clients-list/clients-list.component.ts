import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { Client } from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
  private readonly clientsApi = inject(ClientsService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<Client[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly page = signal(1);
  readonly pageSize = 25;

  search = '';
  ville = '';
  inclureSommeil = false;

  ngOnInit(): void {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.clientsApi
      .list({
        search: this.search.trim() || undefined,
        ville: this.ville.trim() || undefined,
        page,
        pageSize: this.pageSize,
        inclureSommeil: this.inclureSommeil || undefined,
      })
      .subscribe({
        next: (data) => {
          this.items.set(data.items ?? []);
          this.total.set(data.total ?? 0);
          this.totalPages.set(data.totalPages ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            err?.error?.message || err?.message || 'Erreur lors du chargement des clients'
          );
        },
      });
  }

  onSearch(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.search = '';
    this.ville = '';
    this.inclureSommeil = false;
    this.load(1);
  }

  prevPage(): void {
    if (this.page() > 1) this.load(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) this.load(this.page() + 1);
  }

  canWrite(): boolean {
    return this.auth.hasRole('Commercial', 'Admin');
  }
}
