import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  DashboardCommercial,
  DashboardClientEncours,
  DashboardDocRecent,
  DashboardTopClient,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/b2b/dashboard`;

  get(opts: { mes?: boolean; dateDebut?: string; dateFin?: string } = {}) {
    let params = new HttpParams();
    if (opts.mes != null) params = params.set('mes', opts.mes);
    if (opts.dateDebut) params = params.set('dateDebut', opts.dateDebut);
    if (opts.dateFin) params = params.set('dateFin', opts.dateFin);

    return this.http.get<ApiResponse<unknown>>(this.base, { params }).pipe(
      map((res) => this.normalize(this.unwrap(res))),
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
    return http?.message || 'Erreur tableau de bord';
  }

  private normalize(raw: unknown): DashboardCommercial {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const periode = (o['periode'] || o['Periode'] || {}) as Record<string, unknown>;
    const devis = (o['devis'] || o['Devis'] || {}) as Record<string, unknown>;
    const factures = (o['factures'] || o['Factures'] || {}) as Record<string, unknown>;
    const clients = (o['clients'] || o['Clients'] || {}) as Record<string, unknown>;
    const top = (o['topClientsCa'] || o['TopClientsCa'] || []) as Record<string, unknown>[];
    const devisRecents = (o['devisRecents'] || o['DevisRecents'] || []) as Record<string, unknown>[];
    const faImp = (o['facturesImpayees'] || o['FacturesImpayees'] || []) as Record<
      string,
      unknown
    >[];
    const listeEncours = (clients['liste'] || clients['Liste'] || []) as Record<string, unknown>[];

    return {
      periode: {
        debut: String(periode['debut'] ?? periode['Debut'] ?? ''),
        fin: String(periode['fin'] ?? periode['Fin'] ?? ''),
      },
      mesUniquement: Boolean(o['mesUniquement'] ?? o['MesUniquement']),
      devis: {
        periodeNb: Number(devis['periodeNb'] ?? devis['PeriodeNb'] ?? 0),
        periodeCaTtc: Number(devis['periodeCaTtc'] ?? devis['PeriodeCaTtc'] ?? 0),
        enAttenteAdmin: Number(devis['enAttenteAdmin'] ?? devis['EnAttenteAdmin'] ?? 0),
      },
      factures: {
        periodeNb: Number(factures['periodeNb'] ?? factures['PeriodeNb'] ?? 0),
        periodeCaTtc: Number(factures['periodeCaTtc'] ?? factures['PeriodeCaTtc'] ?? 0),
        impayeesNb: Number(factures['impayeesNb'] ?? factures['ImpayeesNb'] ?? 0),
        resteAPayer: Number(factures['resteAPayer'] ?? factures['ResteAPayer'] ?? 0),
      },
      clients: {
        avecEncoursNb: Number(clients['avecEncoursNb'] ?? clients['AvecEncoursNb'] ?? 0),
        encoursTotal: Number(clients['encoursTotal'] ?? clients['EncoursTotal'] ?? 0),
        liste: listeEncours.map(
          (c): DashboardClientEncours => ({
            numero: String(c['numero'] ?? c['Numero'] ?? ''),
            intitule: String(c['intitule'] ?? c['Intitule'] ?? ''),
            encours: Number(c['encours'] ?? c['Encours'] ?? 0),
          })
        ),
      },
      topClientsCa: top.map(
        (t): DashboardTopClient => ({
          clientNumero: String(t['clientNumero'] ?? t['ClientNumero'] ?? ''),
          clientIntitule: String(t['clientIntitule'] ?? t['ClientIntitule'] ?? ''),
          nbFactures: Number(t['nbFactures'] ?? t['NbFactures'] ?? 0),
          caTtc: Number(t['caTtc'] ?? t['CaTtc'] ?? 0),
        })
      ),
      devisRecents: devisRecents.map((d) => this.normalizeDoc(d)),
      facturesImpayees: faImp.map((d) => this.normalizeDoc(d)),
    };
  }

  private normalizeDoc(row: Record<string, unknown>): DashboardDocRecent {
    return {
      numeroPiece: String(row['numeroPiece'] ?? row['NumeroPiece'] ?? ''),
      dateDocument: (row['dateDocument'] ?? row['DateDocument']) as string | null,
      clientNumero: (row['clientNumero'] ?? row['ClientNumero']) as string | null,
      clientIntitule: (row['clientIntitule'] ?? row['ClientIntitule']) as string | null,
      totalTTC: (row['totalTTC'] ?? row['TotalTTC']) as number | null,
      netAPayer: (row['netAPayer'] ?? row['NetAPayer']) as number | null,
      resteAPayer: (row['resteAPayer'] ?? row['ResteAPayer']) as number | null,
    };
  }
}
