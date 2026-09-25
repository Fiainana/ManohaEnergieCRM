import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { CreateUserAppRequest, UserApp } from '../models/user-app.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  list() {
    return this.http.get<ApiResponse<UserApp[] | Record<string, unknown>>>(this.base).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Impossible de charger les utilisateurs');
        return this.normalizeList(res.data);
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  create(body: CreateUserAppRequest) {
    return this.http.post<ApiResponse<UserApp>>(this.base, this.clean(body)).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Création utilisateur impossible');
        return res.data;
      }),
      catchError((err) => throwError(() => new Error(this.readError(err))))
    );
  }

  private clean(body: CreateUserAppRequest): CreateUserAppRequest {
    const out: CreateUserAppRequest = {
      login: body.login.trim(),
      nom: body.nom.trim(),
      vendeur: !!body.vendeur,
      acheteur: !!body.acheteur,
      caissier: !!body.caissier,
      chargeRecouvrement: !!body.chargeRecouvrement,
      receptionnaire: !!body.receptionnaire,
      isAdmin: !!body.isAdmin,
      actif: body.actif !== false,
      roles: body.roles?.filter(Boolean),
    };
    if (body.password?.trim()) out.password = body.password;
    if (body.prenom?.trim()) out.prenom = body.prenom.trim();
    if (body.matricule?.trim()) out.matricule = body.matricule.trim();
    if (body.fonction?.trim()) out.fonction = body.fonction.trim();
    if (body.service?.trim()) out.service = body.service.trim();
    if (body.rfidCode?.trim()) out.rfidCode = body.rfidCode.trim();
    if (body.pin?.trim()) out.pin = body.pin.trim();
    return out;
  }

  private normalizeList(data: unknown): UserApp[] {
    if (Array.isArray(data)) return data as UserApp[];
    if (data && typeof data === 'object') {
      const raw = data as Record<string, unknown>;
      const items = raw['items'] || raw['Items'] || raw['users'] || raw['Users'];
      if (Array.isArray(items)) return items as UserApp[];
    }
    return [];
  }

  private readError(err: unknown): string {
    const http = err as HttpErrorResponse;
    const body = http?.error as ApiResponse | undefined;
    if (body?.errors?.length) return body.errors.join(' · ');
    if (body?.message) return body.message;
    if (body?.detail) return body.detail;
    if (http?.status === 403) return 'Accès réservé à l’administrateur.';
    if (http?.status >= 500) return body?.message || 'Erreur serveur lors de la création utilisateur.';
    return http?.message || 'Erreur utilisateurs';
  }
}
