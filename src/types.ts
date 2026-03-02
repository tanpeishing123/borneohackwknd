export type UserRole = 'farmer' | 'collector' | null;

export interface FarmerData {
  name: string;
  idNumber: string;
  mspoNumber: string;
  landArea: number;
  areaUnit: 'Acre' | 'Hectare';
  boundaryPoints: { lat: number; lng: number }[];
}

export interface Transaction {
  id: string;
  farmerId: string;
  farmerName: string;
  weight: number;
  timestamp: string;
  location: { lat: number; lng: number };
  status: 'pending' | 'synced' | 'flagged';
  mode: 'field' | 'weighbridge';
}
