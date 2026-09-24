import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientsService } from '../../../core/services/clients.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsApi = inject(ClientsService);
  private readonly auth = inject(AuthService);

  readonly isEdit = signal(false);
  readonly numero = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    numero: [''],
    intitule: ['', [Validators.required, Validators.maxLength(69)]],
    adresse: [''],
    complement: [''],
    codePostal: [''],
    ville: [''],
    pays: [''],
    telephone: [''],
    telecopie: [''],
    email: [''],
    siret: [''],
    identifiant: [''],
    representantCode: [''],
    sommeil: [false],
  });

  ngOnInit(): void {
    if (!this.auth.hasRole('Commercial', 'Admin')) {
      void this.router.navigate(['/clients']);
      return;
    }

    const num = this.route.snapshot.paramMap.get('numero');
    if (num) {
      this.isEdit.set(true);
      this.numero.set(num);
      this.form.controls.numero.disable();
      this.load(num);
    }
  }

  load(numero: string): void {
    this.loading.set(true);
    this.clientsApi.getByNumero(numero).subscribe({
      next: (data) => {
        const c = data.client;
        this.form.patchValue({
          numero: c.numero,
          intitule: c.intitule,
          adresse: c.adresse ?? '',
          complement: c.complement ?? '',
          codePostal: c.codePostal ?? '',
          ville: c.ville ?? '',
          pays: c.pays ?? '',
          telephone: c.telephone ?? '',
          telecopie: c.telecopie ?? '',
          email: c.email ?? '',
          siret: c.siret ?? '',
          identifiant: c.identifiant ?? '',
          sommeil: !!c.sommeil,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Impossible de charger le client');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    if (this.isEdit() && this.numero()) {
      this.clientsApi
        .update(this.numero()!, {
          intitule: raw.intitule,
          adresse: raw.adresse || null,
          complement: raw.complement || null,
          codePostal: raw.codePostal || null,
          ville: raw.ville || null,
          pays: raw.pays || null,
          telephone: raw.telephone || null,
          telecopie: raw.telecopie || null,
          email: raw.email || null,
          siret: raw.siret || null,
          identifiant: raw.identifiant || null,
          representantCode: raw.representantCode || null,
          sommeil: raw.sommeil,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            void this.router.navigate(['/clients', this.numero()]);
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err?.error?.message || err?.message || 'Mise à jour impossible');
          },
        });
    } else {
      this.clientsApi
        .create({
          numero: raw.numero?.trim() || null,
          intitule: raw.intitule,
          adresse: raw.adresse || null,
          complement: raw.complement || null,
          codePostal: raw.codePostal || null,
          ville: raw.ville || null,
          pays: raw.pays || null,
          telephone: raw.telephone || null,
          telecopie: raw.telecopie || null,
          email: raw.email || null,
          siret: raw.siret || null,
          identifiant: raw.identifiant || null,
          representantCode: raw.representantCode || null,
        })
        .subscribe({
          next: (created) => {
            this.saving.set(false);
            const num = created?.numero || raw.numero;
            void this.router.navigate(num ? ['/clients', num] : ['/clients']);
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err?.error?.message || err?.message || 'Création impossible');
          },
        });
    }
  }
}
