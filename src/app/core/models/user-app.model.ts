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
  rfidCode?: string;
  pin?: string;
  nom: string;
  prenom?: string;
  matricule?: string;
  fonction?: string;
  service?: string;
  vendeur?: boolean;
  acheteur?: boolean;
  caissier?: boolean;
  chargeRecouvrement?: boolean;
  receptionnaire?: boolean;
  isAdmin?: boolean;
  actif?: boolean;
  roles?: string[];
}
