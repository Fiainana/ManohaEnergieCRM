import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FacturesService } from '../../core/services/factures.service';
import { FactureDetail } from '../../core/models/facture.model';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './facture-detail.component.html',
  styleUrl: './facture-detail.component.scss',
})
export class FactureDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facturesApi = inject(FacturesService);

  readonly loading = signal(true);
  readonly printing = signal(false);
  readonly error = signal<string | null>(null);
  readonly printMsg = signal<string | null>(null);
  readonly facture = signal<FactureDetail | null>(null);
  readonly clientNumero = signal<string | null>(null);

  ngOnInit(): void {
    const piece = this.route.snapshot.paramMap.get('numeroPiece');
    this.clientNumero.set(this.route.snapshot.queryParamMap.get('client'));
    if (!piece) {
      this.loading.set(false);
      this.error.set('Numéro de pièce manquant');
      return;
    }
    this.load(piece);
  }

  load(piece: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.facturesApi.getByPiece(piece).subscribe({
      next: (data) => {
        this.facture.set(data);
        if (!this.clientNumero() && data.clientNumero) {
          this.clientNumero.set(data.clientNumero);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Facture introuvable');
      },
    });
  }

  imprimer(): void {
    const f = this.facture();
    if (!f?.numeroPiece || this.printing()) return;
    this.printing.set(true);
    this.error.set(null);
    this.printMsg.set(null);
    this.facturesApi.imprimer(f.numeroPiece).subscribe({
      next: (blob) => {
        this.facturesApi.openPrint(blob);
        this.printing.set(false);
        this.printMsg.set('Document envoyé à l\'impression.');
      },
      error: (err) => {
        this.printing.set(false);
        this.error.set(err?.message || 'Impression impossible');
      },
    });
  }
}
