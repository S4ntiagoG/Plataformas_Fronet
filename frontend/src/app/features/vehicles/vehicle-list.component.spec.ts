import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { VehicleListComponent } from './vehicle-list.component';
import { VehicleMechanicService } from './services/vehicle-mechanic.service';
import { MechanicVehicleItem } from './models/vehicle-mechanic.models';

const MOCK_ITEMS: MechanicVehicleItem[] = [
  {
    id: 1,
    serviceOrderId: 11,
    plate: 'B7X-982',
    brand: 'Toyota',
    model: 'Corolla',
    vehicleYear: 2022,
    chassisNumber: 'VIN-TOY-001',
    color: 'Silver',
    ownerName: 'Michael Johnson',
    lastServiceDate: '12/05/2023',
    serviceOrderDate: '2023-05-12',
    primaryReason: 'Mantenimiento preventivo',
    status: 'LISTO'
  },
  {
    id: 2,
    serviceOrderId: 22,
    plate: 'ABC123',
    brand: 'Honda',
    model: 'Civic',
    vehicleYear: 2020,
    chassisNumber: 'VIN-HON-002',
    color: 'Black',
    ownerName: 'Sarah Williams',
    lastServiceDate: '20/09/2023',
    serviceOrderDate: '2023-09-20',
    primaryReason: 'Revisión de frenos',
    status: 'EN PROGRESO'
  },
  {
    id: 3,
    serviceOrderId: null,
    plate: 'XYZ-789',
    brand: 'Ford',
    model: 'F-150',
    vehicleYear: 2019,
    chassisNumber: 'VIN-FOR-003',
    color: 'White',
    ownerName: 'David Smith',
    lastServiceDate: '-- / -- / ----',
    serviceOrderDate: null,
    primaryReason: null,
    status: 'PENDIENTE'
  }
];

describe('VehicleListComponent', () => {
  let fixture: ComponentFixture<VehicleListComponent>;
  let component: VehicleListComponent;
  let mechanicService: jasmine.SpyObj<VehicleMechanicService>;

  beforeEach(async () => {
    mechanicService = jasmine.createSpyObj<VehicleMechanicService>('VehicleMechanicService', ['getMechanicVehicles']);
    mechanicService.getMechanicVehicles.and.returnValue(of(MOCK_ITEMS));

    await TestBed.configureTestingModule({
      imports: [VehicleListComponent],
      providers: [
        { provide: VehicleMechanicService, useValue: mechanicService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load vehicles', () => {
    expect(component.allVehicles().length).toBe(3);
    expect(component.loading()).toBeFalse();
  });

  it('filters vehicles by search query', () => {
    component.searchQuery.set('corolla');
    expect(component.filteredVehicles().length).toBe(1);
    expect(component.filteredVehicles()[0].plate).toBe('B7X-982');
  });

  it('filters vehicles by status', () => {
    component.setStatusFilter('EN PROGRESO');
    expect(component.filteredVehicles().length).toBe(1);
    expect(component.filteredVehicles()[0].status).toBe('EN PROGRESO');
  });

  it('navigates to edit the latest service order', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.openActionModal('EDIT', MOCK_ITEMS[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/service-orders', 11, 'edit']);
  });

  it('does not navigate to edit when the vehicle has no service order', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.openActionModal('EDIT', MOCK_ITEMS[2]);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the workshop work order for the selected vehicle', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.openActionModal('SERVICE', MOCK_ITEMS[1]);
    expect(router.navigate).toHaveBeenCalledWith(['/vehicles', 2, 'work-order']);
  });

  it('updates vehicle status successfully', () => {
    component.updateVehicleStatus(1, 'EN PROGRESO');
    const updated = component.allVehicles().find((v) => v.id === 1);
    expect(updated?.status).toBe('EN PROGRESO');
  });
});

