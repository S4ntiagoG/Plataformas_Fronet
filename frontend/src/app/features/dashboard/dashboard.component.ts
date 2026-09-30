import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MechanicVehicleItem, VehicleStatus } from '../vehicles/models/vehicle-mechanic.models';
import { VehicleMechanicService } from '../vehicles/services/vehicle-mechanic.service';

interface ActivityItem {
  orderId: number;
  date: string;
  label: string;
  description: string;
  tone: 'red' | 'yellow' | 'green' | 'orange';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly mechanicService = inject(VehicleMechanicService);

  readonly vehicles = signal<MechanicVehicleItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly stats = computed(() => {
    const list = this.vehicles();
    return {
      activeServices: list.filter((vehicle) => vehicle.status !== 'LISTO').length,
      pendingOrders: list.filter((vehicle) => vehicle.status === 'PENDIENTE').length,
      readyVehicles: list.filter((vehicle) => vehicle.status === 'LISTO').length
    };
  });

  readonly visibleVehicles = computed(() => this.vehicles().slice(0, 4));

  readonly recentActivity = computed<ActivityItem[]>(() => this.vehicles()
    .filter((vehicle): vehicle is MechanicVehicleItem & { serviceOrderId: number; serviceOrderDate: string } =>
      vehicle.serviceOrderId !== null && vehicle.serviceOrderDate !== null
    )
    .sort((left, right) => right.serviceOrderDate.localeCompare(left.serviceOrderDate))
    .slice(0, 4)
    .map((vehicle) => ({
      orderId: vehicle.serviceOrderId,
      date: this.formatDate(vehicle.serviceOrderDate),
      label: `Orden de servicio #${vehicle.serviceOrderId}`,
      description: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate} · ${vehicle.primaryReason || 'Motivo no registrado'}`,
      tone: this.activityTone(vehicle.status)
    })));

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    this.mechanicService.getMechanicVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando tablero:', err);
        this.error.set('No se pudo sincronizar el tablero con el backend. Asegúrate de que Spring Boot esté ejecutándose.');
        this.vehicles.set([]);
        this.loading.set(false);
      }
    });
  }

  getVehicleServiceLabel(vehicle: MechanicVehicleItem): string {
    return vehicle.primaryReason || 'Sin orden de servicio';
  }

  getStatusClass(status: VehicleStatus): string {
    const classes: Record<VehicleStatus, string> = {
      LISTO: 'status-listo',
      'EN PROGRESO': 'status-progress',
      PENDIENTE: 'status-pending'
    };

    return classes[status];
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO').format(new Date(year, month - 1, day));
  }

  private activityTone(status: VehicleStatus): ActivityItem['tone'] {
    const tones: Record<VehicleStatus, ActivityItem['tone']> = {
      LISTO: 'green',
      'EN PROGRESO': 'orange',
      PENDIENTE: 'yellow'
    };
    return tones[status];
  }
}
