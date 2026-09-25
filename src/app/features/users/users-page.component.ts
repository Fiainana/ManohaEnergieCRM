import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UsersService } from '../../core/services/users.service';
import { UserApp } from '../../core/models/user-app.model';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(UsersService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly items = signal<UserApp[]>([]);

  login = '';
  password = '';
  nom = '';
  prenom = '';
  matricule = '';
  roleCommercial = true;
  roleAdmin = false;
  actif = true;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Erreur chargement');
      },
    });
  }

  rolesOf(u: UserApp): string {
    if (Array.isArray(u.roles)) return u.roles.join(', ');
    return u.roles || (u.isAdmin ? 'Admin' : '');
  }

  submit(): void {
    if (!this.login.trim() || !this.nom.trim() || !this.password.trim()) {
      this.error.set('Login, nom et mot de passe sont obligatoires.');
      return;
    }
    const roles: string[] = [];
    if (this.roleCommercial) roles.push('Commercial');
    if (this.roleAdmin) roles.push('Admin');
    if (roles.length === 0) roles.push('Commercial');

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api
      .create({
        login: this.login.trim(),
        password: this.password,
        nom: this.nom.trim(),
        prenom: this.prenom.trim() || undefined,
        matricule: this.matricule.trim() || undefined,
        vendeur: this.roleCommercial,
        isAdmin: this.roleAdmin,
        actif: this.actif,
        roles,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Utilisateur créé.');
          this.login = '';
          this.password = '';
          this.nom = '';
          this.prenom = '';
          this.matricule = '';
          this.roleCommercial = true;
          this.roleAdmin = false;
          this.actif = true;
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Création impossible');
        },
      });
  }
}
