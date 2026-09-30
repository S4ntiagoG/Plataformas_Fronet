export type VehicleStatus = 'LISTO' | 'EN PROGRESO' | 'PENDIENTE';

export interface MechanicVehicleItem {
  id: number;
  serviceOrderId: number | null;
  plate: string;
  brand: string;
  model: string;
  vehicleYear: number;
  chassisNumber: string;
  color?: string;
  ownerName: string;
  lastServiceDate: string; // Formato DD/MM/YYYY o '-- / -- / ----'
  serviceOrderDate: string | null;
  primaryReason: string | null;
  status: VehicleStatus;
}

