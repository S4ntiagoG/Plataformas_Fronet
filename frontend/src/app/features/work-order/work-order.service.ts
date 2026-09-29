import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../core/config/api.config';
import { WorkOrderResponse, WorkOrderUpdateRequest } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  getForVehicle(vehicleId: number): Observable<WorkOrderResponse> {
    return this.http.get<WorkOrderResponse>(
      `${this.baseUrl}${API_CONFIG.workOrdersPath}/vehicle/${vehicleId}`
    );
  }

  update(id: number, request: WorkOrderUpdateRequest): Observable<WorkOrderResponse> {
    return this.http.put<WorkOrderResponse>(
      `${this.baseUrl}${API_CONFIG.workOrdersPath}/${id}`,
      request
    );
  }
}