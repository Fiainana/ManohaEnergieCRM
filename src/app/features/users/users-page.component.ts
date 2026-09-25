import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { UserApp } from '../../core/models/user-app.model';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(UsersService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly listError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly toast = signal<string | null>(null);
  readonly items = signal<UserApp[]>([]);
  readonly modalOpen = signal(false);

  search = '';
  login = '';
  password = '';
  nom = '';
  prenom = '';
  matricule = '';
  fonction = '';
  service = '';
  roleCommercial = true;
  roleAdmin = false;
  vendeur = true;
  acheteur = false;
  caissier = false;
  chargeRecouvrement = false;
  receptionnaire = false;
  actif = true;

  ngOnInit(): void {
    this.reload();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen()) this.closeModal();
  }

  filtered(): UserApp[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((u) =>
      [u.login, u.nom, u.prenom, u.sageMatricule, this.rolesOf(u)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  reload(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.api.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.listError.set(err?.message || 'Erreur chargement');
      },
    });
  }

  openModal(): void {
    this.resetForm();
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
  }

  rolesOf(u: UserApp): string {
    if (Array.isArray(u.roles)) return u.roles.join(', ');
    return u.roles || (u.isAdmin ? 'Admin' : '');
  }

  roleList(u: UserApp): string[] {
    return this.rolesOf(u)
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
  }

  initials(u: UserApp): string {
    const a = (u.prenom || '').trim();
    const b = (u.nom || u.login || '?').trim();
    return ((a[0] || '') + (b[0] || '?')).toUpperCase();
  }

  submit(): void {
    if (!this.login.trim() || !this.nom.trim() || !this.password.trim()) {
      this.formError.set('Login, nom et mot de passe sont obligatoires.');
      return;
    }
    const roles: string[] = [];
    if (this.roleCommercial) roles.push('Commercial');
    if (this.roleAdmin) roles.push('Admin');
    if (roles.length === 0) roles.push('Commercial');

    this.saving.set(true);
    this.formError.set(null);
    this.api
      .create({
        login: this.login,
        password: this.password,
        nom: this.nom,
        prenom: this.prenom,
        matricule: this.matricule,
        fonction: this.fonction,
        service: this.service,
        vendeur: this.vendeur || this.roleCommercial,
        acheteur: this.acheteur,
        caissier: this.caissier,
        chargeRecouvrement: this.chargeRecouvrement,
        receptionnaire: this.receptionnaire,
        isAdmin: this.roleAdmin,
        actif: this.actif,
        roles,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.toast.set('Utilisateur créé');
          setTimeout(() => this.toast.set(null), 2800);
          this.resetForm();
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.message || 'Création impossible');
        },
      });
  }

  private resetForm(): void {
    this.login = '';
    this.password = '';
    this.nom = '';
    this.prenom = '';
    this.matricule = '';
    this.fonction = '';
    this.service = '';
    this.roleCommercial = true;
    this.roleAdmin = false;
    this.vendeur = true;
    this.acheteur = false;
    this.caissier = false;
    this.chargeRecouvrement = false;
    this.receptionnaire = false;
    this.actif = true;
  }
}
