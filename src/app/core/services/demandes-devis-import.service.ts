import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  CreateDemandeDevisImportRequest,
  DemandeDevisImportDetail,
  DemandeDevisImportEntete,
  DemandeDevisImportLigne,
  DemandeDevisImportListResult,
  ReponseDemandeDevisImportRequest,
} from '../models/demande-devis-import.model';

@Injectable({ providedIn: 'root' })
export class DemandesDevisImportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/demandes-devis-import`;

  listMes(opts: { statut?: string; page?: number; pageSize?: number } = {}) {
    return this.listAt(`${this.base}/mes`, opts);
  }

  listAll(opts: { statut?: string; page?: number; pageSize?: number } = {}) {
    return this.listAt(this.base, opts);
  }

  get(id: number) {
    return this.http.get<ApiResponse<unknown>>(`${this.base}/${id}`).pipe(
      map((res) => this.normalizeDetail(this.unwrap(res))),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  create(body: CreateDemandeDevisImportRequest) {
    return this.http.post<ApiResponse<unknown>>(this.base, body).pipe(
      map((res) => {
        const data = this.unwrap(res) as Record<string, unknown>;
        return {
          id: Number(data['id'] ?? data['Id'] ?? 0),
          statut: String(data['statut'] ?? data['Statut'] ?? 'Brouillon'),
          message: (data['message'] ?? data['Message']) as string | undefined,
        };
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  envoyer(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/envoyer`, {}).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  reponse(id: number, body: ReponseDemandeDevisImportRequest) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/reponse`, body).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  valider(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/valider`, {}).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  refuser(id: number, motif: string) {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${id}/refuser`, { motif })
      .pipe(
        map((res) => this.unwrap(res)),
        catchError((err) => throwError(() => new Error(this.readError(err))))
      );
  }

  annuler(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/annuler`, {}).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  private listAt(url: string, opts: { statut?: string; page?: number; pageSize?: number }) {
    let params = new HttpParams();
    if (opts.statut) params = params.set('statut', opts.statut);
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);

    return this.http.get<ApiResponse<unknown>>(url, { params }).pipe(
      map((res) => this.normalizeList(this.unwrap(res))),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
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
    return http?.message || 'Erreur API demandes devis import';
  }

  private normalizeList(raw: unknown): DemandeDevisImportListResult {
    const bag = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const rows = (bag['items'] || bag['Items'] || []) as Record<string, unknown>[];
    const total = Number(bag['total'] ?? bag['Total'] ?? rows.length);
    const pageSize = Number(bag['pageSize'] ?? bag['PageSize'] ?? 25);
    return {
      page: Number(bag['page'] ?? bag['Page'] ?? 1),
      pageSize,
      total,
      totalPages:
        Number(bag['totalPages'] ?? bag['TotalPages'] ?? (total === 0 ? 0 : Math.ceil(total / pageSize))),
      items: rows.map((r) => this.normalizeEntete(r)),
    };
  }

  private normalizeDetail(raw: unknown): DemandeDevisImportDetail {
    const bag = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const enteteRaw = (bag['entete'] || bag['Entete'] || bag) as Record<string, unknown>;
    const lignesRaw = (bag['lignes'] || bag['Lignes'] || []) as Record<string, unknown>[];
    return {
      entete: this.normalizeEntete(enteteRaw),
      lignes: lignesRaw.map((l) => this.normalizeLigne(l)),
    };
  }

  private normalizeEntete(row: Record<string, unknown>): DemandeDevisImportEntete {
    return {
      id: Number(row['id'] ?? row['Id'] ?? 0),
      demandeurId: Number(row['demandeurId'] ?? row['DemandeurId'] ?? 0),
      clientNumero: (row['clientNumero'] ?? row['ClientNumero']) as string | null,
      fournisseur: (row['fournisseur'] ?? row['Fournisseur']) as string | null,
      paysOrigine: (row['paysOrigine'] ?? row['PaysOrigine']) as string | null,
      note: (row['note'] ?? row['Note']) as string | null,
      noteFournisseur: (row['noteFournisseur'] ?? row['NoteFournisseur']) as string | null,
      dateValidite: (row['dateValidite'] ?? row['DateValidite']) as string | null,
      statut: String(row['statut'] ?? row['Statut'] ?? ''),
      motifRefus: (row['motifRefus'] ?? row['MotifRefus']) as string | null,
      createdAt: (row['createdAt'] ?? row['CreatedAt']) as string | null,
      validatedBy: (row['validatedBy'] ?? row['ValidatedBy']) as number | null,
    };
  }

  private normalizeLigne(row: Record<string, unknown>): DemandeDevisImportLigne {
    return {
      id: Number(row['id'] ?? row['Id'] ?? 0),
      designation: String(row['designation'] ?? row['Designation'] ?? ''),
      refFournisseur: (row['refFournisseur'] ?? row['RefFournisseur']) as string | null,
      quantite: Number(row['quantite'] ?? row['Quantite'] ?? 0),
      prixEstime: (row['prixEstime'] ?? row['PrixEstime']) as number | null,
      prixFournisseur: (row['prixFournisseur'] ?? row['PrixFournisseur']) as number | null,
      devise: (row['devise'] ?? row['Devise']) as string | null,
      delai: (row['delai'] ?? row['Delai']) as string | null,
    };
  }
}
