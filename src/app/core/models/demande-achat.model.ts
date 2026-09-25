export type DemandeAchatStatut =
  | 'Envoyee'
  | 'EnAttenteArticle'
  | 'ArticlePret'
  | 'CommandeSageCreee'
  | 'Receptionnee'
  | 'Facturable'
  | 'Cloturee'
  | 'Annulee'
  | string;

export interface DemandeurInfo {
  login?: string | null;
  nom?: string | null;
  prenom?: string | null;
  libelle?: string | null;
}

export interface DemandeAchatEntete {
  id: number;
  demandeurUserId: number;
  statut: DemandeAchatStatut;
  statutLibelle?: string | null;
  fournisseurCode?: string | null;
  depotNo?: number | null;
  depotIntitule?: string | null;
  pieceSage?: string | null;
  note?: string | null;
  dateCreation?: string | null;
  dateMaj?: string | null;
  nbLignes?: number | null;
  demandeur?: DemandeurInfo | null;
}

export interface DemandeAchatLigne {
  id: number;
  demandeId: number;
  refFournisseur: string;
  quantite: number;
  articleSage?: string | null;
  qteRecue?: number | null;
}

export interface DemandeAchatDetail {
  entete: DemandeAchatEntete;
  lignes: DemandeAchatLigne[];
}

export interface DemandeAchatListResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: DemandeAchatEntete[];
}

export interface CreateDemandeAchatLigne {
  refFournisseur: string;
  quantite: number;
}

export interface CreateDemandeAchatRequest {
  note?: string | null;
  lignes: CreateDemandeAchatLigne[];
}

export interface CreerArticleDemandeRequest {
  articleReference: string;
  designation?: string | null;
  prixAchat: number;
  prixVente?: number | null;
  uniteVenteNo?: number | null;
  codeFamille?: string | null;
  suiviStock?: boolean;
  rattacherSiExiste?: boolean;
}

export interface GenererSageDemandeRequest {
  depotNo: number;
}
