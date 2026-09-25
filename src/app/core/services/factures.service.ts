import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
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

  private normalize(raw: FactureDetail): FactureDetail {
    const anyRaw = raw as unknown as Record<string, unknown>;
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
