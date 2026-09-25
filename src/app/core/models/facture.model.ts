export interface FactureLigne {
  reference?: string | null;
  designation?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
  remise?: number | null;
  montantHT?: number | null;
  montantTTC?: number | null;
}

export interface FactureDetail {
  numeroPiece: string;
  dateDocument?: string | null;
  reference?: string | null;
  clientNumero?: string | null;
  clientIntitule?: string | null;
  totalHT?: number | null;
  totalTTC?: number | null;
  netAPayer?: number | null;
  montantRegle?: number | null;
  resteAPayer?: number | null;
  lignes?: FactureLigne[];
}
