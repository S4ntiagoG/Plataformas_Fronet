import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  WorkOrderLabor,
  WorkOrderPart,
  WorkOrderResponse,
  WorkOrderStatus,
  WorkOrderTask,
  WorkOrderUpdateRequest
} from '../../core/models/api.models';
import { WorkOrderService } from './work-order.service';

@Component({
  selector: 'app-work-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-order.component.html',
  styleUrl: './work-order.component.css'
})
export class WorkOrderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workOrderService = inject(WorkOrderService);
  private nextLocalId = -1;

  readonly order = signal<WorkOrderResponse | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly invoicePrintMode = signal(false);
  readonly partsSubtotal = computed(() => this.moneyRound(
    (this.order()?.parts ?? []).reduce((sum, part) => sum + part.quantity * part.unitPrice, 0)
  ));
  readonly laborSubtotal = computed(() => this.moneyRound(
    (this.order()?.labor ?? []).reduce((sum, item) => sum + item.hours * item.rate, 0)
  ));
  readonly supplies = computed(() => this.moneyRound(this.partsSubtotal() * 0.05));
  readonly tax = computed(() => this.moneyRound(
    (this.partsSubtotal() + this.laborSubtotal() + this.supplies()) * 0.085
  ));
  readonly total = computed(() => this.moneyRound(
    this.partsSubtotal() + this.laborSubtotal() + this.supplies() + this.tax()
  ));

  diagnosisDraft = '';
  taskDraft = '';
  partNameDraft = '';
  partNumberDraft = '';
  partQuantityDraft = 1;
  partPriceDraft = 0;
  laborDescriptionDraft = '';
  laborHoursDraft = 1;
  laborRateDraft = 0;

  ngOnInit(): void {
    const vehicleId = Number(this.route.snapshot.paramMap.get('vehicleId'));
    if (!Number.isInteger(vehicleId) || vehicleId < 1) {
      this.error.set('El vehículo solicitado no es válido.');
      this.loading.set(false);
      return;
    }

    this.workOrderService.getForVehicle(vehicleId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.diagnosisDraft = order.diagnosis;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la orden. Verifica que el backend esté conectado.');
        this.loading.set(false);
      }
    });
  }

  updateDiagnosis(event: Event): void {
    this.diagnosisDraft = (event.target as HTMLTextAreaElement).value;
  }

  updateStatus(event: Event): void {
    const current = this.order();
    if (!current) return;
    this.order.set({ ...current, status: (event.target as HTMLSelectElement).value as WorkOrderStatus });
  }

  addTask(event: Event): void {
    event.preventDefault();
    const description = this.taskDraft.trim();
    if (!description) return;
    this.updateOrder((order) => ({
      ...order,
      tasks: [...order.tasks, { id: this.localId(), description, completed: false }]
    }));
    this.taskDraft = '';
  }

  toggleTask(taskId: number, completed: boolean): void {
    this.updateOrder((order) => ({
      ...order,
      tasks: order.tasks.map((task) => task.id === taskId ? { ...task, completed } : task)
    }));
  }

  removeTask(taskId: number): void {
    this.updateOrder((order) => ({ ...order, tasks: order.tasks.filter((task) => task.id !== taskId) }));
  }

  addPart(event: Event): void {
    event.preventDefault();
    const name = this.partNameDraft.trim();
    if (!name || this.partQuantityDraft < 1 || this.partPriceDraft < 0) return;
    const part: WorkOrderPart = {
      id: this.localId(),
      name,
      partNumber: this.partNumberDraft.trim(),
      quantity: this.partQuantityDraft,
      unitPrice: this.partPriceDraft
    };
    this.updateOrder((order) => ({ ...order, parts: [...order.parts, part] }));
    this.partNameDraft = '';
    this.partNumberDraft = '';
    this.partQuantityDraft = 1;
    this.partPriceDraft = 0;
  }

  removePart(partId: number): void {
    this.updateOrder((order) => ({ ...order, parts: order.parts.filter((part) => part.id !== partId) }));
  }

  addLabor(event: Event): void {
    event.preventDefault();
    const description = this.laborDescriptionDraft.trim();
    if (!description || this.laborHoursDraft <= 0 || this.laborRateDraft < 0) return;
    const labor: WorkOrderLabor = {
      id: this.localId(),
      description,
      hours: this.laborHoursDraft,
      rate: this.laborRateDraft
    };
    this.updateOrder((order) => ({ ...order, labor: [...order.labor, labor] }));
    this.laborDescriptionDraft = '';
    this.laborHoursDraft = 1;
    this.laborRateDraft = 0;
  }

  removeLabor(laborId: number): void {
    this.updateOrder((order) => ({ ...order, labor: order.labor.filter((item) => item.id !== laborId) }));
  }

  save(): void {
    const order = this.order();
    if (!order || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');

    const request: WorkOrderUpdateRequest = {
      status: order.status,
      diagnosis: this.diagnosisDraft,
      tasks: order.tasks.map(({ description, completed }) => ({ description, completed })),
      parts: order.parts.map(({ name, partNumber, quantity, unitPrice }) => ({
        name,
        partNumber,
        quantity,
        unitPrice
      })),
      labor: order.labor.map(({ description, hours, rate }) => ({ description, hours, rate }))
    };

    this.workOrderService.update(order.id, request).subscribe({
      next: (saved) => {
        this.order.set(saved);
        this.diagnosisDraft = saved.diagnosis;
        this.saving.set(false);
        this.notice.set('Orden guardada. Los cambios quedaron registrados.');
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudieron guardar los cambios. Revisa los valores e intenta de nuevo.');
      }
    });
  }

  printOrder(): void {
    window.print();
  }

  printInvoice(): void {
    this.invoicePrintMode.set(true);
    window.addEventListener('afterprint', () => this.invoicePrintMode.set(false), { once: true });
    window.setTimeout(() => window.print(), 0);
  }

  goBack(): void {
    void this.router.navigate(['/vehicles']);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  private updateOrder(update: (order: WorkOrderResponse) => WorkOrderResponse): void {
    const current = this.order();
    if (current) this.order.set(update(current));
  }

  private localId(): number {
    return this.nextLocalId--;
  }

  private moneyRound(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}