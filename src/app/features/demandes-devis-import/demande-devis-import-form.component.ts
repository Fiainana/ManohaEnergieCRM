import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DemandesDevisImportService } from '../../core/services/demandes-devis-import.service';

interface LineDraft {
  designation: string;
  refFournisseur: string;
  quantite: number;
  prixEstime: number | null;
  devise: string;
}

@Component({
  selector: 'app-demande-devis-import-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './demande-devis-import-form.component.html',
  styleUrl: './demande-devis-import-form.component.scss',
})
export class DemandeDevisImportFormComponent {
  private readonly api = inject(DemandesDevisImportService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  clientNumero = '';
  fournisseur = '';
  paysOrigine = '';
  note = '';
  lines: LineDraft[] = [
    { designation: '', refFournisseur: '', quantite: 1, prixEstime: null, devise: 'EUR' },
  ];

  addLine(): void {
    this.lines = [
      ...this.lines,
      { designation: '', refFournisseur: '', quantite: 1, prixEstime: null, devise: 'EUR' },
    ];
  }

  removeLine(i: number): void {
    this.lines = this.lines.filter((_, idx) => idx !== i);
    if (this.lines.length === 0) this.addLine();
  }

  save(): void {
    const lignes = this.lines
      .filter((l) => l.designation.trim() && Number(l.quantite) > 0)
      .map((l) => ({
        designation: l.designation.trim(),
        refFournisseur: l.refFournisseur.trim() || null,
        quantite: Number(l.quantite),
        prixEstime: l.prixEstime != null && l.prixEstime > 0 ? Number(l.prixEstime) : null,
        devise: l.devise.trim() || null,
      }));

    if (lignes.length === 0) {
      this.error.set('Ajoutez au moins une ligne avec désignation et quantité.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        clientNumero: this.clientNumero.trim() || null,
        fournisseur: this.fournisseur.trim() || null,
        paysOrigine: this.paysOrigine.trim() || null,
        note: this.note.trim() || null,
        lignes,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.id) void this.router.navigate(['/demandes-devis-import', res.id]);
          else void this.router.navigate(['/demandes-devis-import']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.message || 'Création impossible');
        },
      });
  }
}
