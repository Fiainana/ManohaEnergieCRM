import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, JsonPipe } from '@angular/common';
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
  readonly error = signal<string | null>(null);
  readonly facture = signal<FactureDetail | null>(null);
  readonly pdfBusy = signal(false);
  readonly pdfError = signal<string | null>(null);
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
        this.error.set(err?.error?.message || err?.message || 'Facture introuvable');
      },
    });
  }

  downloadPdf(): void {
    const piece = this.facture()?.numeroPiece;
    if (!piece) return;
    this.pdfBusy.set(true);
    this.pdfError.set(null);
    this.facturesApi.downloadPdf(piece).subscribe({
      next: ({ blob, fileName }) => {
        this.facturesApi.openPdf(blob, fileName);
        this.pdfBusy.set(false);
      },
      error: (err) => {
        this.pdfBusy.set(false);
        this.pdfError.set(err?.message || 'PDF indisponible');
      },
    });
  }
}
