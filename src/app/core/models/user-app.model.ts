export interface UserApp {
  id?: number;
  login?: string | null;
  nom?: string | null;
  prenom?: string | null;
  sageMatricule?: string | null;
  isAdmin?: boolean;
  roles?: string | string[] | null;
  actif?: boolean;
  derniereConnexion?: string | null;
}

export interface CreateUserAppRequest {
  login: string;
  password?: string;
  nom: string;
  prenom?: string;
  matricule?: string;
  fonction?: string;
  service?: string;
  vendeur?: boolean;
  isAdmin?: boolean;
  actif?: boolean;
  roles?: string[];
}
