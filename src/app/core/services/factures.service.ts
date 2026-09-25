import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { FactureDetail } from '../models/facture.model';

@Injectable({ providedIn: 'root' })
export class FacturesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/factures`;

  getByPiece(numeroPiece: string) {
    return this.http
      .get<ApiResponse<FactureDetail>>(`${this.base}/${encodeURIComponent(numeroPiece)}`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Facture introuvable');
          }
          return this.normalize(res.data);
        })
      );
  }

  downloadPdf(numeroPiece: string) {
    return this.http
      .get(`${this.base}/${encodeURIComponent(numeroPiece)}/pdf`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((res) => {
          const blob = res.body;
          if (!blob || blob.size === 0) {
            throw new Error('PDF vide');
          }
          const cd = res.headers.get('content-disposition') || '';
          const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
          const fileName = match?.[1] || `facture-${numeroPiece}.pdf`;
          return { blob, fileName: decodeURIComponent(fileName) };
        }),
        catchError((err: HttpErrorResponse) => {
          const msg =
            err.status === 403
              ? err.error?.message ||
                'Impression déjà effectuée. Seul un administrateur peut réimprimer.'
              : err.status === 404
                ? 'Facture introuvable.'
                : 'Impossible de générer le PDF.';
          return throwError(() => new Error(msg));
        })
      );
  }

  openPdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  private normalize(raw: FactureDetail & Record<string, unknown>): FactureDetail {
    const anyRaw = raw as Record<string, unknown>;
    return {
      numeroPiece: String(raw.numeroPiece || anyRaw['NumeroPiece'] || ''),
      dateDocument: (raw.dateDocument || anyRaw['DateDocument']) as string | null,
      reference: (raw.reference || anyRaw['Reference']) as string | null,
      clientNumero: (raw.clientNumero || anyRaw['ClientNumero'] || anyRaw['numeroClient']) as
        | string
        | null,
      clientIntitule: (raw.clientIntitule || anyRaw['ClientIntitule'] || anyRaw['intitule']) as
        | string
        | null,
      totalHT: (raw.totalHT ?? anyRaw['TotalHT']) as number | null,
      totalTTC: (raw.totalTTC ?? anyRaw['TotalTTC']) as number | null,
      netAPayer: (raw.netAPayer ?? anyRaw['NetAPayer']) as number | null,
      montantRegle: (raw.montantRegle ?? anyRaw['MontantRegle']) as number | null,
      resteAPayer: (raw.resteAPayer ?? anyRaw['ResteAPayer']) as number | null,
      lignes: (raw.lignes || anyRaw['Lignes'] || []) as FactureDetail['lignes'],
    };
  }
}
