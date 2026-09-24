import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
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
          return res.data;
        })
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
        })
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
        })
      );
  }

  create(body: CreateClientRequest) {
    return this.http.post<ApiResponse<Client>>(this.base, body).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Création impossible');
        }
        return res.data as Client;
      })
    );
  }

  update(numero: string, body: UpdateClientRequest) {
    return this.http
      .put<ApiResponse<Client>>(`${this.base}/${encodeURIComponent(numero)}`, body)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message || 'Mise à jour impossible');
          }
          return res.data as Client;
        })
      );
  }
}
