import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DemandesAchatService } from '../../core/services/demandes-achat.service';

interface LineDraft {
  refFournisseur: string;
  quantite: number;
}

@Component({
  selector: 'app-demande-achat-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './demande-achat-form.component.html',
  styleUrl: './demande-achat-form.component.scss',
})
export class DemandeAchatFormComponent {
  private readonly api = inject(DemandesAchatService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  note = '';
  lines: LineDraft[] = [{ refFournisseur: '', quantite: 1 }];

  addLine(): void {
    this.lines = [...this.lines, { refFournisseur: '', quantite: 1 }];
  }

  removeLine(i: number): void {
    this.lines = this.lines.filter((_, idx) => idx !== i);
    if (this.lines.length === 0) this.addLine();
  }

  save(): void {
    const lignes = this.lines
      .map((l) => ({
        refFournisseur: l.refFournisseur.trim(),
        quantite: Number(l.quantite) || 0,
      }))
      .filter((l) => l.refFournisseur && l.quantite > 0);

    if (lignes.length === 0) {
      this.error.set('Ajoutez au moins une ligne (réf. fournisseur + quantité).');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        note: this.note.trim() || null,
        lignes,
      })
      .subscribe({
        next: (detail) => {
          this.saving.set(false);
          void this.router.navigate(['/demandes-achat', detail.entete.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Création impossible');
        },
      });
  }
}
