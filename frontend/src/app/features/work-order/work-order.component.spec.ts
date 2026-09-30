import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { WorkOrderResponse } from '../../core/models/api.models';
import { WorkOrderService } from './work-order.service';
import { WorkOrderComponent } from './work-order.component';

const MOCK_ORDER: WorkOrderResponse = {
  id: 31,
  orderNumber: 'SU-2026-031',
  status: 'EN PROGRESO',
  diagnosis: 'Revisión inicial',
  entryDate: '2026-09-29',
  currentMileage: 12000,
  primaryReason: 'Ruido al frenar',
  customerObservations: '',
  vehicle: {
    id: 7,
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    vehicleYear: 2022,
    ownerName: 'Ana Pérez'
  },
  tasks: [],
  parts: [],
  labor: [],
  partsSubtotal: 0,
  laborSubtotal: 0,
  supplies: 0,
  tax: 0,
  total: 0
};

describe('WorkOrderComponent', () => {
  let fixture: ComponentFixture<WorkOrderComponent>;
  let component: WorkOrderComponent;
  let workOrderService: jasmine.SpyObj<WorkOrderService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    workOrderService = jasmine.createSpyObj<WorkOrderService>('WorkOrderService', ['getForVehicle', 'update']);
    workOrderService.getForVehicle.and.returnValue(of(MOCK_ORDER));
    workOrderService.update.and.returnValue(of(MOCK_ORDER));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [WorkOrderComponent],
      providers: [
        { provide: WorkOrderService, useValue: workOrderService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ vehicleId: '7' }) } }
        },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the work order for the selected vehicle', () => {
    expect(workOrderService.getForVehicle).toHaveBeenCalledWith(7);
    expect(component.order()?.vehicle.plate).toBe('ABC123');
  });

  it('adds and completes a task', () => {
    component.taskDraft = 'Inspeccionar frenos';
    component.addTask(new Event('submit'));
    const task = component.order()?.tasks[0];

    expect(task?.description).toBe('Inspeccionar frenos');
    component.toggleTask(task!.id, true);
    expect(component.order()?.tasks[0].completed).toBeTrue();
  });

  it('calculates parts, labor, supplies, tax, and total', () => {
    component.order.update((order) => order ? {
      ...order,
      parts: [{ id: 1, name: 'Pastillas', partNumber: 'P-1', quantity: 2, unitPrice: 100 }],
      labor: [{ id: 2, description: 'Instalación', hours: 3, rate: 50 }]
    } : order);

    expect(component.partsSubtotal()).toBe(200);
    expect(component.laborSubtotal()).toBe(150);
    expect(component.supplies()).toBe(10);
    expect(component.tax()).toBe(30.6);
    expect(component.total()).toBe(390.6);
  });

  it('saves the edited diagnosis, status, and line items', () => {
    component.diagnosisDraft = 'Pastillas desgastadas';
    component.order.update((order) => order ? {
      ...order,
      status: 'LISTO',
      parts: [{ id: 1, name: 'Pastillas', partNumber: 'P-1', quantity: 1, unitPrice: 100 }]
    } : order);

    component.save();

    expect(workOrderService.update).toHaveBeenCalledWith(31, {
      status: 'LISTO',
      diagnosis: 'Pastillas desgastadas',
      tasks: [],
      parts: [{ name: 'Pastillas', partNumber: 'P-1', quantity: 1, unitPrice: 100 }],
      labor: []
    });
    expect(component.notice()).toContain('Orden guardada');
  });
});