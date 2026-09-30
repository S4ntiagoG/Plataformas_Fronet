export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}

export interface ClientRequest {
  name: string;
  identificationNumber: string;
  email: string;
  phone: string;
}

export interface ClientResponse extends ClientRequest {
  id: number;
}

export interface VehicleRequest {
  vehicleType: string;
  brand: string;
  model: string;
  plate: string;
  chassisNumber: string;
  vehicleYear: number;
  client: { id: number };
}

export interface VehicleResponse extends Omit<VehicleRequest, 'client'> {
  id: number;
  client: ClientResponse;
}

export interface VehicleLookupRequest {
  plate: string;
  identificationNumber: string;
}

export interface ClientVehicleHomeResponse {
  vehicleId: number;
  vehicleType: string;
  brand: string;
  model: string;
  vehicleYear: number;
  plate: string;
  orderNumber: string | null;
  status: string;
}

export interface ServiceHistoryItem {
  serviceOrderId: number;
  entryDate: string;
  primaryReason: string;
  currentMileage: number;
  customerObservations: string | null;
  serviceCost: number | null;
}

export interface ServiceOrderRequest {
  entryDate: string;
  primaryReason: string;
  currentMileage: number;
  customerObservations: string;
  serviceCost?: number | null;
  photoFront?: string;
  photoRightSide?: string;
  photoBack?: string;
  photoOdometer?: string;
  photoExtra?: string;
  vehicle: { id: number };
}

export interface ServiceOrderResponse extends ServiceOrderRequest {
  id: number;
  vehicle: VehicleResponse;
  status?: 'LISTO' | 'EN PROGRESO' | 'PENDIENTE';
}

export type WorkOrderStatus = 'LISTO' | 'EN PROGRESO' | 'PENDIENTE';

export interface WorkOrderTask {
  id: number;
  description: string;
  completed: boolean;
}

export interface WorkOrderPart {
  id: number;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
}

export interface WorkOrderLabor {
  id: number;
  description: string;
  hours: number;
  rate: number;
}

export interface WorkOrderResponse {
  id: number;
  orderNumber: string;
  status: WorkOrderStatus;
  diagnosis: string;
  entryDate: string;
  currentMileage: number;
  primaryReason: string;
  customerObservations: string;
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    vehicleYear: number;
    ownerName: string;
  };
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  labor: WorkOrderLabor[];
  partsSubtotal: number;
  laborSubtotal: number;
  supplies: number;
  tax: number;
  total: number;
}

export interface WorkOrderUpdateRequest {
  status: WorkOrderStatus;
  diagnosis: string;
  tasks: Array<Pick<WorkOrderTask, 'description' | 'completed'>>;
  parts: Array<Pick<WorkOrderPart, 'name' | 'partNumber' | 'quantity' | 'unitPrice'>>;
  labor: Array<Pick<WorkOrderLabor, 'description' | 'hours' | 'rate'>>;
}

export interface ServiceOrderUpdateRequest {
  primaryReason: string;
  currentMileage: number;
  customerObservations: string;
}

export interface VehicleIntakeDraft {
  vehicle: {
    vehicleType: string;
    brand: string;
    plate: string;
    chassisNumber: string;
    model: string;
    vehicleYear: number;
  };
  customer: ClientRequest;
  entry: {
    primaryReason: string;
    currentMileage: number;
    customerObservations: string;
  };
}
