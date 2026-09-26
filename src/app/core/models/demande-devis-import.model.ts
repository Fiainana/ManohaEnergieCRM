export type DemandeDevisImportStatut =
  | 'Brouillon'
  | 'Envoyee'
  | 'ReponseRecue'
  | 'Validee'
  | 'Refusee'
  | 'Annulee'
  | string;

export interface DemandeDevisImportEntete {
  id: number;
  demandeurId: number;
  clientNumero?: string | null;
  fournisseur?: string | null;
  paysOrigine?: string | null;
  note?: string | null;
  noteFournisseur?: string | null;
  dateValidite?: string | null;
  statut: DemandeDevisImportStatut;
  motifRefus?: string | null;
  createdAt?: string | null;
  validatedBy?: number | null;
}

export interface DemandeDevisImportLigne {
  id: number;
  designation: string;
  refFournisseur?: string | null;
  quantite: number;
  prixEstime?: number | null;
  prixFournisseur?: number | null;
  devise?: string | null;
  delai?: string | null;
}

export interface DemandeDevisImportDetail {
  entete: DemandeDevisImportEntete;
  lignes: DemandeDevisImportLigne[];
}

export interface DemandeDevisImportListResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: DemandeDevisImportEntete[];
}

export interface CreateDemandeDevisImportLigne {
  designation: string;
  refFournisseur?: string | null;
  quantite: number;
  prixEstime?: number | null;
  devise?: string | null;
}

export interface CreateDemandeDevisImportRequest {
  clientNumero?: string | null;
  fournisseur?: string | null;
  paysOrigine?: string | null;
  note?: string | null;
  lignes: CreateDemandeDevisImportLigne[];
}

export interface ReponseDemandeDevisImportLigne {
  ligneId: number;
  prixFournisseur: number;
  devise?: string | null;
  delai?: string | null;
}

export interface ReponseDemandeDevisImportRequest {
  noteFournisseur?: string | null;
  dateValidite?: string | null;
  lignes: ReponseDemandeDevisImportLigne[];
}
