import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  CreateDemandeAchatRequest,
  CreerArticleDemandeRequest,
  DemandeAchatDetail,
  DemandeAchatEntete,
  DemandeAchatLigne,
  DemandeAchatListResult,
  GenererSageDemandeRequest,
} from '../models/demande-achat.model';

@Injectable({ providedIn: 'root' })
export class DemandesAchatService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/demandes-achat`;

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

  create(body: CreateDemandeAchatRequest) {
    return this.http.post<ApiResponse<unknown>>(this.base, body).pipe(
      map((res) => this.normalizeDetail(this.unwrap(res))),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  annuler(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/annuler`, {}).pipe(
      map((res) => this.normalizeDetail(this.unwrap(res))),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  creerArticle(demandeId: number, ligneId: number, body: CreerArticleDemandeRequest) {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${demandeId}/lignes/${ligneId}/article`, body)
      .pipe(
        map((res) => this.unwrap(res)),
        catchError((err) => throwError(() => new Error(this.readError(err))))
      );
  }

  genererSage(demandeId: number, body: GenererSageDemandeRequest) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${demandeId}/generer-sage`, body).pipe(
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
    return http?.message || "Erreur API demandes d'achat";
  }

  private normalizeList(raw: unknown): DemandeAchatListResult {
    const bag = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const rows = (bag['items'] || bag['Items'] || []) as Record<string, unknown>[];
    return {
      page: Number(bag['page'] ?? bag['Page'] ?? 1),
      pageSize: Number(bag['pageSize'] ?? bag['PageSize'] ?? 25),
      total: Number(bag['total'] ?? bag['Total'] ?? rows.length),
      totalPages: Number(bag['totalPages'] ?? bag['TotalPages'] ?? (rows.length ? 1 : 0)),
      items: rows.map((r) => this.normalizeEntete(r)),
    };
  }

  private normalizeDetail(raw: unknown): DemandeAchatDetail {
    const bag = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const enteteRaw = (bag['entete'] || bag['Entete'] || bag) as Record<string, unknown>;
    const lignesRaw = (bag['lignes'] || bag['Lignes'] || []) as Record<string, unknown>[];
    return {
      entete: this.normalizeEntete(enteteRaw),
      lignes: lignesRaw.map((l) => this.normalizeLigne(l)),
    };
  }

  private normalizeEntete(row: Record<string, unknown>): DemandeAchatEntete {
    const dem = (row['demandeur'] || row['Demandeur'] || {}) as Record<string, unknown>;
    return {
      id: Number(row['id'] ?? row['Id'] ?? 0),
      demandeurUserId: Number(row['demandeurUserId'] ?? row['DemandeurUserId'] ?? 0),
      statut: String(row['statut'] ?? row['Statut'] ?? ''),
      statutLibelle: (row['statutLibelle'] ?? row['StatutLibelle']) as string | null,
      fournisseurCode: (row['fournisseurCode'] ?? row['FournisseurCode']) as string | null,
      depotNo: (row['depotNo'] ?? row['DepotNo']) as number | null,
      depotIntitule: (row['depotIntitule'] ?? row['DepotIntitule']) as string | null,
      pieceSage: (row['pieceSage'] ?? row['PieceSage']) as string | null,
      note: (row['note'] ?? row['Note']) as string | null,
      dateCreation: (row['dateCreation'] ?? row['DateCreation']) as string | null,
      dateMaj: (row['dateMaj'] ?? row['DateMaj']) as string | null,
      nbLignes: (row['nbLignes'] ?? row['NbLignes']) as number | null,
      demandeur: {
        login: (dem['login'] ?? dem['Login']) as string | null,
        nom: (dem['nom'] ?? dem['Nom']) as string | null,
        prenom: (dem['prenom'] ?? dem['Prenom']) as string | null,
        libelle: (dem['libelle'] ?? dem['Libelle']) as string | null,
      },
    };
  }

  private normalizeLigne(row: Record<string, unknown>): DemandeAchatLigne {
    const articleSage = (row['articleSage'] ?? row['ArticleSage'] ?? row['articleReference'] ?? row['ArticleReference']) as
      | string
      | null;
    return {
      id: Number(row['id'] ?? row['Id'] ?? 0),
      demandeId: Number(row['demandeId'] ?? row['DemandeId'] ?? 0),
      refFournisseur: String(row['refFournisseur'] ?? row['RefFournisseur'] ?? ''),
      designation: (row['designation'] ?? row['Designation']) as string | null,
      quantite: Number(row['quantite'] ?? row['Quantite'] ?? 0),
      articleSage: articleSage,
      articleReference: articleSage,
      qteRecue: (row['qteRecue'] ?? row['QteRecue']) as number | null,
      estNouvelArticle: Boolean(row['estNouvelArticle'] ?? row['EstNouvelArticle'] ?? !articleSage),
    };
  }
}
