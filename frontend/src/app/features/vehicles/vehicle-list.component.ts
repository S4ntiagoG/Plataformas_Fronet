import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MechanicVehicleItem, VehicleStatus } from './models/vehicle-mechanic.models';
import { VehicleMechanicService } from './services/vehicle-mechanic.service';

interface ActionModalData {
  type: 'EDIT' | 'HISTORY' | 'SERVICE';
  vehicle: MechanicVehicleItem;
}

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.css'
})
export class VehicleListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly mechanicService = inject(VehicleMechanicService);

  readonly allVehicles = signal<MechanicVehicleItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  // Controles de filtrado y búsqueda
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<VehicleStatus | 'TODOS'>('TODOS');
  readonly showFilterMenu = signal(false);

  // Paginación (10 por página según maqueta)
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // Estado del modal de detalle / acción
  readonly modalState = signal<ActionModalData | null>(null);

  // Lista filtrada en tiempo real
  readonly filteredVehicles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.allVehicles().filter((item) => {
      const matchesStatus = status === 'TODOS' || item.status === status;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = `${item.plate} ${item.brand} ${item.model} ${item.vehicleYear} ${item.color || ''} ${item.ownerName}`.toLowerCase();
      return searchableText.includes(query);
    });
  });

  // Cálculo de páginas totales
  readonly totalPages = computed(() => {
    const total = this.filteredVehicles().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  // Elementos paginados para la tabla actual
  readonly paginatedVehicles = computed(() => {
    const items = this.filteredVehicles();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = (page - 1) * size;
    return items.slice(startIndex, startIndex + size);
  });

  // Información textual para el pie de página
  readonly paginationInfo = computed(() => {
    const total = this.filteredVehicles().length;
    if (total === 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return { start, end, total };
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.error.set('');
    this.mechanicService.getMechanicVehicles().subscribe({
      next: (data) => {
        this.allVehicles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando vehículos:', err);
        this.error.set('No se pudo establecer conexión con el backend (http://localhost:8080). Asegúrate de que el backend de Spring Boot esté iniciado con "./gradlew bootRun".');
        this.allVehicles.set([]);
        this.loading.set(false);
      }
    });
  }

  deleteVehicle(id: number, plate: string): void {
    if (!confirm(`¿Estás seguro de eliminar de la base de datos el vehículo con placa ${plate}?`)) {
      return;
    }
    this.mechanicService.deleteVehicle(id).subscribe({
      next: () => {
        this.allVehicles.update((list) => list.filter((v) => v.id !== id));
        if (this.modalState()?.vehicle.id === id) {
          this.closeModal();
        }
      },
      error: (err) => {
        console.error('Error eliminando vehículo:', err);
        alert('No se pudo eliminar el vehículo. Si tiene órdenes de servicio asociadas, deben removerse primero.');
      }
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleFilterMenu(): void {
    this.showFilterMenu.update((prev) => !prev);
  }

  setStatusFilter(status: VehicleStatus | 'TODOS'): void {
    this.selectedStatus.set(status);
    this.showFilterMenu.set(false);
    this.currentPage.set(1);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  openActionModal(type: 'EDIT' | 'HISTORY' | 'SERVICE', vehicle: MechanicVehicleItem): void {
    if (type === 'EDIT') {
      if (vehicle.serviceOrderId) {
        void this.router.navigate(['/service-orders', vehicle.serviceOrderId, 'edit']);
      }
      return;
    }
    if (type === 'SERVICE') {
      void this.router.navigate(['/vehicles', vehicle.id, 'work-order']);
      return;
    }
    this.modalState.set({ type, vehicle });
  }

  closeModal(): void {
    this.modalState.set(null);
  }

  updateVehicleStatus(id: number, newStatus: VehicleStatus): void {
    this.allVehicles.update((list) =>
      list.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
    if (this.modalState()) {
      const currentModal = this.modalState()!;
      this.modalState.set({
        ...currentModal,
        vehicle: { ...currentModal.vehicle, status: newStatus }
      });
    }
  }
}
