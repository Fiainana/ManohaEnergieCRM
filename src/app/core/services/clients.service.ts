import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  Client,
  ClientDetailResult,
  ClientListParams,
  ClientListResult,
  CreateClientRequest,
  FactureClientListResult,
  UpdateClientRequest,
} from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/clients`;

  list(params: ClientListParams = {}) {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.ville) httpParams = httpParams.set('ville', params.ville);
    if (params.codePostal) httpParams = httpParams.set('codePostal', params.codePostal);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.inclureSommeil) httpParams = httpParams.set('inclureSommeil', true);

    return this.http
      .get<ApiResponse<ClientListResult>>(this.base, { params: httpParams })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Impossible de charger les clients');
          }
          return this.normalizeList(res.data as unknown as Record<string, unknown>);
        }),
        catchError((err) => throwError(() => this.toError(err, 'Impossible de charger les clients')))
      );
  }

  getByNumero(numero: string) {
    return this.http
      .get<ApiResponse<ClientDetailResult>>(`${this.base}/${encodeURIComponent(numero)}`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Client introuvable');
          }
          return res.data;
        }),
        catchError((err) => throwError(() => this.toError(err, 'Client introuvable')))
      );
  }

  listFactures(numero: string, impayees = false, page = 1, pageSize = 20) {
    const params = new HttpParams()
      .set('impayees', impayees)
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http
      .get<ApiResponse<FactureClientListResult>>(
        `${this.base}/${encodeURIComponent(numero)}/factures`,
        { params }
      )
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Impossible de charger les factures');
          }
          return res.data;
        }),
        catchError((err) => throwError(() => this.toError(err, 'Impossible de charger les factures')))
      );
  }

  create(body: CreateClientRequest) {
    return this.http.post<ApiResponse<unknown>>(this.base, body).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || res.detail || 'Création impossible');
        }
        return this.normalizeClient(res.data as Record<string, unknown>);
      }),
      catchError((err) => throwError(() => this.toError(err, 'Création du client impossible')))
    );
  }

  update(numero: string, body: UpdateClientRequest) {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/${encodeURIComponent(numero)}`, body)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || res.detail || 'Mise à jour impossible');
          }
          return this.normalizeClient(res.data as Record<string, unknown>);
        }),
        catchError((err) => throwError(() => this.toError(err, 'Mise à jour impossible')))
      );
  }

  /** Extrait message + detail du corps ApiResponse en cas d'HttpErrorResponse. */
  private toError(err: unknown, fallback: string): Error {
    if (err instanceof Error && !(err as HttpErrorResponse).status) {
      return err;
    }
    const http = err as HttpErrorResponse;
    const body = http?.error as ApiResponse | string | null | undefined;
    if (body && typeof body === 'object') {
      const msg =
        body.message ||
        body.detail ||
        (Array.isArray(body.errors) && body.errors.length ? body.errors.join(' · ') : null);
      if (msg) return new Error(msg);
    }
    if (typeof body === 'string' && body.trim()) return new Error(body.trim());
    if (http?.message) return new Error(http.message);
    return new Error(fallback);
  }

  private normalizeList(raw: Record<string, unknown>): ClientListResult {
    const items = (raw['items'] || raw['Items'] || []) as Record<string, unknown>[];
    return {
      page: Number(raw['page'] ?? raw['Page'] ?? 1),
      pageSize: Number(raw['pageSize'] ?? raw['PageSize'] ?? 25),
      total: Number(raw['total'] ?? raw['Total'] ?? 0),
      totalPages: Number(raw['totalPages'] ?? raw['TotalPages'] ?? 0),
      items: items.map((row) => this.normalizeClient(row)),
    };
  }

  private normalizeClient(row: Record<string, unknown>): Client {
    return {
      numero: String(row['numero'] ?? row['Numero'] ?? ''),
      intitule: String(row['intitule'] ?? row['Intitule'] ?? ''),
      adresse: (row['adresse'] ?? row['Adresse']) as string | null,
      complement: (row['complement'] ?? row['Complement']) as string | null,
      codePostal: (row['codePostal'] ?? row['CodePostal']) as string | null,
      ville: (row['ville'] ?? row['Ville']) as string | null,
      pays: (row['pays'] ?? row['Pays']) as string | null,
      telephone: (row['telephone'] ?? row['Telephone']) as string | null,
      telecopie: (row['telecopie'] ?? row['Telecopie']) as string | null,
      email: (row['email'] ?? row['Email']) as string | null,
      siret: (row['siret'] ?? row['Siret']) as string | null,
      identifiant: (row['identifiant'] ?? row['Identifiant']) as string | null,
      sommeil: Boolean(row['sommeil'] ?? row['Sommeil']),
    };
  }
}
