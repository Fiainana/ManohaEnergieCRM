/** Réponse standard renvoyée par Sage100Api */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string | null;
  detail?: string | null;
  code?: string | null;
  data?: T;
  count?: number | null;
  errors?: string[] | null;
  retryAfterSeconds?: number | null;
}

export interface TokenResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: string;
  authMethod?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id?: number;
  userId?: string | number;
  login?: string;
  nom?: string;
  prenom?: string;
  name?: string;
  isAdmin?: boolean;
  authMethod?: string;
  sageMatricule?: string;
  roles?: string[];
}

export type AppRole =
  | 'Admin'
  | 'Commercial'
  | 'Rayon'
  | 'Caisse'
  | 'Depot'
  | 'Recouvrement';
