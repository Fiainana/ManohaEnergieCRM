import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  CreateDevisRequest,
  DevisDetail,
  DevisEntete,
  DevisLigne,
  DevisListResult,
  UpdateDevisRequest,
} from '../models/devis.model';

@Injectable({ providedIn: 'root' })
export class DevisService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/devis`;

  list(opts: { search?: string; client?: string; page?: number; pageSize?: number; mes?: boolean } = {}) {
    let params = new HttpParams();
    if (opts.search) params = params.set('search', opts.search);
    if (opts.client) params = params.set('client', opts.client);
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);
    if (opts.mes != null) params = params.set('mes', opts.mes);

    return this.http.get<ApiResponse<Record<string, unknown>>>(this.base, { params }).pipe(
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.message || 'Impossible de charger les devis');
        return this.normalizeList(res.data);
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  get(numeroPiece: string) {
    return this.http
      .get<ApiResponse<Record<string, unknown>>>(`${this.base}/${encodeURIComponent(numeroPiece)}`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) throw new Error(res.message || 'Devis introuvable');
          return this.normalizeDetail(res.data);
        }),
        catchError((err) => throwError(() => new Error(this.readError(err))))
      );
  }

  create(body: CreateDevisRequest) {
    return this.http.post<ApiResponse<Record<string, unknown>>>(this.base, body).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Création devis impossible');
        return this.pickPiece(res.data);
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  update(numeroPiece: string, body: UpdateDevisRequest) {
    return this.http
      .put<ApiResponse<Record<string, unknown>>>(`${this.base}/${encodeURIComponent(numeroPiece)}`, body)
      .pipe(
        map((res) => {
          if (!res.success) throw new Error(res.message || 'Mise à jour devis impossible');
          return this.pickPiece(res.data) || numeroPiece;
        }),
        catchError((err) => throwError(() => new Error(this.readError(err))))
      );
  }

  cancel(numeroPiece: string) {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${encodeURIComponent(numeroPiece)}`).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Annulation impossible');
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  facturer(numeroPiece: string) {
    return this.http.post<ApiResponse<Record<string, unknown>>>(`${this.base}/facturer`, { numeroPiece }).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Facturation impossible');
        return res.data;
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  private readError(err: unknown): string {
    const http = err as HttpErrorResponse;
    const body = http?.error as ApiResponse | undefined;
    if (body?.errors?.length) return body.errors.join(' · ');
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    if (typeof http?.error === 'string' && http.error.trim()) return http.error;
    return http?.message || 'Erreur API devis';
  }

  private normalizeList(raw: Record<string, unknown>): DevisListResult {
    const items = (raw['items'] || raw['Items'] || []) as Record<string, unknown>[];
    return {
      page: Number(raw['page'] ?? raw['Page'] ?? 1),
      pageSize: Number(raw['pageSize'] ?? raw['PageSize'] ?? 25),
      total: Number(raw['total'] ?? raw['Total'] ?? 0),
      totalPages: Number(raw['totalPages'] ?? raw['TotalPages'] ?? 0),
      items: items.map((row) => this.normalizeEntete(row)),
    };
  }

  private normalizeDetail(raw: Record<string, unknown>): DevisDetail {
    const enteteRaw = (raw['entete'] || raw['Entete'] || raw) as Record<string, unknown>;
    const lignes = (raw['lignes'] || raw['Lignes'] || []) as Record<string, unknown>[];
    return {
      entete: this.normalizeEntete(enteteRaw),
      lignes: lignes.map((l) => this.normalizeLigne(l)),
    };
  }

  private normalizeEntete(row: Record<string, unknown>): DevisEntete {
    return {
      numeroPiece: String(row['numeroPiece'] ?? row['NumeroPiece'] ?? ''),
      dateDocument: (row['dateDocument'] ?? row['DateDocument']) as string | null,
      reference: (row['reference'] ?? row['Reference']) as string | null,
      clientNumero: (row['clientNumero'] ?? row['ClientNumero']) as string | null,
      clientIntitule: (row['clientIntitule'] ?? row['ClientIntitule']) as string | null,
      totalHT: (row['totalHT'] ?? row['TotalHT']) as number | null,
      totalTTC: (row['totalTTC'] ?? row['TotalTTC']) as number | null,
      netAPayer: (row['netAPayer'] ?? row['NetAPayer']) as number | null,
      representant: (row['representant'] ?? row['Representant']) as string | null,
    };
  }

  private normalizeLigne(row: Record<string, unknown>): DevisLigne {
    return {
      numeroLigne: (row['numeroLigne'] ?? row['NumeroLigne']) as number | null,
      articleReference: String(row['articleReference'] ?? row['ArticleReference'] ?? ''),
      designation: (row['designation'] ?? row['Designation']) as string | null,
      quantite: Number(row['quantite'] ?? row['Quantite'] ?? 0),
      prixUnitaire: (row['prixUnitaire'] ?? row['PrixUnitaire']) as number | null,
      remisePourcent: (row['remisePourcent'] ?? row['RemisePourcent']) as number | null,
      montantHT: (row['montantHT'] ?? row['MontantHT']) as number | null,
      montantTTC: (row['montantTTC'] ?? row['MontantTTC']) as number | null,
    };
  }

  private pickPiece(data?: Record<string, unknown> | null): string {
    if (!data) return '';
    const entete = (data['entete'] || data['Entete'] || data) as Record<string, unknown>;
    return String(
      data['numeroPiece'] || data['NumeroPiece'] || entete['numeroPiece'] || entete['NumeroPiece'] || ''
    );
  }
}
