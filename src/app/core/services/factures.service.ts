import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { FactureDetail, FactureEntete, FactureListResult } from '../models/facture.model';

@Injectable({ providedIn: 'root' })
export class FacturesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/factures`;

  list(opts: {
    search?: string;
    client?: string;
    aujourdhui?: boolean;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    let params = new HttpParams();
    if (opts.search) params = params.set('search', opts.search);
    if (opts.client) params = params.set('client', opts.client);
    if (opts.aujourdhui) params = params.set('aujourdhui', true);
    if (opts.dateDebut) params = params.set('dateDebut', opts.dateDebut);
    if (opts.dateFin) params = params.set('dateFin', opts.dateFin);
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);

    return this.http.get<ApiResponse<unknown>>(this.base, { params }).pipe(
      map((res) => this.normalizeList(this.unwrap(res))),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  getByPiece(numeroPiece: string) {
    return this.http
      .get<ApiResponse<FactureDetail>>(`${this.base}/${encodeURIComponent(numeroPiece)}`)
      .pipe(
        map((res) => {
          const data = this.unwrap(res) as FactureDetail;
          if (!data) throw new Error('Facture introuvable');
          return this.normalizeDetail(data as unknown as Record<string, unknown>);
        }),
        catchError((err) => throwError(() => new Error(this.readError(err))))
      );
  }

  /**
   * Impression unique (commercial) / illimitée (admin).
   * Ouvre le flux serveur dans une fenêtre d'impression — pas un téléchargement PDF libre.
   */
  imprimer(numeroPiece: string) {
    return this.http
      .get(`${this.base}/${encodeURIComponent(numeroPiece)}/imprimer`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((resp) => {
          const blob = resp.body;
          if (!blob || blob.size === 0) throw new Error('Document d\'impression vide');
          if (blob.type && blob.type.includes('json')) {
            throw new Error('Erreur lors de la génération du document');
          }
          return blob;
        }),
        catchError((err) => throwError(() => new Error(this.readPrintError(err))))
      );
  }

  /** Ouvre le blob et déclenche l'impression navigateur. */
  openPrint(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
      // Popup bloquée : fallback lien temporaire
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }
    // Laisse le viewer PDF native déclencher print si possible
    const tryPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* viewer natif */
      }
    };
    setTimeout(tryPrint, 800);
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  private unwrap(res: unknown): unknown {
    if (!res || typeof res !== 'object') return res;
    const o = res as Record<string, unknown>;
    if ('data' in o && o['data'] != null) return o['data'];
    if ('Data' in o && o['Data'] != null) return o['Data'];
    return res;
  }

  private readError(err: unknown): string {
    const http = err as HttpErrorResponse;
    const body = http?.error as ApiResponse | undefined;
    if (body?.errors?.length) return body.errors.join(' · ');
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    return http?.message || 'Erreur API factures';
  }

  private readPrintError(err: unknown): string {
    const http = err as HttpErrorResponse;
    if (http?.status === 403) {
      return 'Impression déjà effectuée. Seul un administrateur peut réimprimer.';
    }
    if (http?.status === 404) return 'Facture introuvable';
    if (http?.error instanceof Blob) {
      return http.status === 403
        ? 'Impression déjà effectuée. Seul un administrateur peut réimprimer.'
        : `Erreur impression (${http.status})`;
    }
    return this.readError(err);
  }

  private normalizeList(raw: unknown): FactureListResult {
    const bag = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const rows = (bag['items'] || bag['Items'] || bag['factures'] || bag['Factures'] || []) as Record<
      string,
      unknown
    >[];
    return {
      page: Number(bag['page'] ?? bag['Page'] ?? 1),
      pageSize: Number(bag['pageSize'] ?? bag['PageSize'] ?? rows.length || 25),
      total: Number(bag['total'] ?? bag['Total'] ?? rows.length),
      totalPages: Number(bag['totalPages'] ?? bag['TotalPages'] ?? (rows.length ? 1 : 0)),
      items: rows.map((r) => this.normalizeEntete(r)),
    };
  }

  private normalizeDetail(raw: Record<string, unknown>): FactureDetail {
    const lignes = (raw['lignes'] || raw['Lignes'] || []) as FactureDetail['lignes'];
    return {
      ...this.normalizeEntete(raw),
      lignes,
    };
  }

  private normalizeEntete(row: Record<string, unknown>): FactureEntete {
    return {
      numeroPiece: String(row['numeroPiece'] ?? row['NumeroPiece'] ?? ''),
      dateDocument: (row['dateDocument'] ?? row['DateDocument']) as string | null,
      reference: (row['reference'] ?? row['Reference']) as string | null,
      clientNumero: (row['clientNumero'] ?? row['ClientNumero'] ?? row['numeroClient']) as string | null,
      clientIntitule: (row['clientIntitule'] ?? row['ClientIntitule'] ?? row['intitule']) as string | null,
      totalHT: (row['totalHT'] ?? row['TotalHT']) as number | null,
      totalTTC: (row['totalTTC'] ?? row['TotalTTC']) as number | null,
      netAPayer: (row['netAPayer'] ?? row['NetAPayer']) as number | null,
      montantRegle: (row['montantRegle'] ?? row['MontantRegle']) as number | null,
      resteAPayer: (row['resteAPayer'] ?? row['ResteAPayer']) as number | null,
    };
  }
}
