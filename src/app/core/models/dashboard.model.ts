export interface DashboardPeriode {
  debut: string;
  fin: string;
}

export interface DashboardDevis {
  periodeNb: number;
  periodeCaTtc: number;
  enAttenteAdmin: number;
}

export interface DashboardFactures {
  periodeNb: number;
  periodeCaTtc: number;
  impayeesNb: number;
  resteAPayer: number;
}

export interface DashboardClientEncours {
  numero: string;
  intitule: string;
  encours: number;
}

export interface DashboardClients {
  avecEncoursNb: number;
  encoursTotal: number;
  liste: DashboardClientEncours[];
}

export interface DashboardTopClient {
  clientNumero: string;
  clientIntitule: string;
  nbFactures: number;
  caTtc: number;
}

export interface DashboardDocRecent {
  numeroPiece: string;
  dateDocument?: string | null;
  clientNumero?: string | null;
  clientIntitule?: string | null;
  totalTTC?: number | null;
  netAPayer?: number | null;
  resteAPayer?: number | null;
}

export interface DashboardCommercial {
  periode: DashboardPeriode;
  mesUniquement: boolean;
  devis: DashboardDevis;
  factures: DashboardFactures;
  clients: DashboardClients;
  topClientsCa: DashboardTopClient[];
  devisRecents: DashboardDocRecent[];
  facturesImpayees: DashboardDocRecent[];
}
