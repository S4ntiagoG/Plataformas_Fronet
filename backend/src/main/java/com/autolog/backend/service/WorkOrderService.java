package com.autolog.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.autolog.backend.dto.WorkOrderLaborRequest;
import com.autolog.backend.dto.WorkOrderPartRequest;
import com.autolog.backend.dto.WorkOrderResponse;
import com.autolog.backend.dto.WorkOrderTaskRequest;
import com.autolog.backend.dto.WorkOrderUpdateRequest;
import com.autolog.backend.model.ServiceOrder;
import com.autolog.backend.model.ServiceOrderLabor;
import com.autolog.backend.model.ServiceOrderPart;
import com.autolog.backend.model.ServiceOrderTask;
import com.autolog.backend.repository.ServiceOrderLaborRepository;
import com.autolog.backend.repository.ServiceOrderPartRepository;
import com.autolog.backend.repository.ServiceOrderRepository;
import com.autolog.backend.repository.ServiceOrderTaskRepository;
import com.autolog.backend.repository.VehicleRepository;

@Service
public class WorkOrderService {

    private static final BigDecimal SUPPLIES_RATE = new BigDecimal("0.05");
    private static final BigDecimal TAX_RATE = new BigDecimal("0.085");

    private final ServiceOrderRepository serviceOrderRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceOrderTaskRepository taskRepository;
    private final ServiceOrderPartRepository partRepository;
    private final ServiceOrderLaborRepository laborRepository;

    public WorkOrderService(
            ServiceOrderRepository serviceOrderRepository,
            VehicleRepository vehicleRepository,
            ServiceOrderTaskRepository taskRepository,
            ServiceOrderPartRepository partRepository,
            ServiceOrderLaborRepository laborRepository) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.vehicleRepository = vehicleRepository;
        this.taskRepository = taskRepository;
        this.partRepository = partRepository;
        this.laborRepository = laborRepository;
    }

    @Transactional
    public Optional<WorkOrderResponse> getOrCreateForVehicle(Long vehicleId) {
        Optional<ServiceOrder> latest = serviceOrderRepository
                .findFirstByVehicleIdOrderByEntryDateDescIdDesc(vehicleId);
        if (latest.isPresent()) {
            return latest.map(this::toResponse);
        }

        return vehicleRepository.findById(vehicleId).map(vehicle -> {
            ServiceOrder order = new ServiceOrder();
            order.setVehicle(vehicle);
            order.setEntryDate(LocalDate.now());
            order.setPrimaryReason("Diagnóstico pendiente");
            order.setCurrentMileage(0);
            order.setCustomerObservations("");
            order.setDiagnosis("");
            order.setStatus("EN PROGRESO");
            return toResponse(serviceOrderRepository.save(order));
        });
    }

    @Transactional(readOnly = true)
    public Optional<WorkOrderResponse> getById(Long id) {
        return serviceOrderRepository.findById(id).map(this::toResponse);
    }

    @Transactional
    public Optional<WorkOrderResponse> update(Long id, WorkOrderUpdateRequest request) {
        return serviceOrderRepository.findById(id).map(order -> {
            order.setStatus(request.status());
            order.setDiagnosis(request.diagnosis() == null ? "" : request.diagnosis().trim());

            taskRepository.deleteByServiceOrderId(id);
            partRepository.deleteByServiceOrderId(id);
            laborRepository.deleteByServiceOrderId(id);

            List<WorkOrderTaskRequest> tasks = request.tasks() == null ? List.of() : request.tasks();
            taskRepository.saveAll(tasks.stream().map(item -> {
                ServiceOrderTask task = new ServiceOrderTask();
                task.setDescription(item.description().trim());
                task.setCompleted(item.completed());
                task.setServiceOrder(order);
                return task;
            }).toList());

            List<WorkOrderPartRequest> parts = request.parts() == null ? List.of() : request.parts();
            partRepository.saveAll(parts.stream().map(item -> {
                ServiceOrderPart part = new ServiceOrderPart();
                part.setName(item.name().trim());
                part.setPartNumber(item.partNumber() == null ? "" : item.partNumber().trim());
                part.setQuantity(item.quantity());
                part.setUnitPrice(item.unitPrice());
                part.setServiceOrder(order);
                return part;
            }).toList());

            List<WorkOrderLaborRequest> labor = request.labor() == null ? List.of() : request.labor();
            laborRepository.saveAll(labor.stream().map(item -> {
                ServiceOrderLabor entry = new ServiceOrderLabor();
                entry.setDescription(item.description().trim());
                entry.setHours(item.hours());
                entry.setRate(item.rate());
                entry.setServiceOrder(order);
                return entry;
            }).toList());

            BigDecimal partsSubtotal = parts.stream()
                    .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal laborSubtotal = labor.stream()
                    .map(item -> item.hours().multiply(item.rate()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal supplies = partsSubtotal.multiply(SUPPLIES_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tax = partsSubtotal.add(laborSubtotal).add(supplies)
                    .multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
            order.setServiceCost(partsSubtotal.add(laborSubtotal).add(supplies).add(tax)
                    .setScale(2, RoundingMode.HALF_UP));

            return toResponse(order);
        });
    }

    private WorkOrderResponse toResponse(ServiceOrder order) {
        List<WorkOrderResponse.WorkOrderTaskResponse> tasks = taskRepository
                .findByServiceOrderIdOrderByIdAsc(order.getId()).stream()
                .map(item -> new WorkOrderResponse.WorkOrderTaskResponse(
                        item.getId(), item.getDescription(), item.isCompleted()))
                .toList();
        List<WorkOrderResponse.WorkOrderPartResponse> parts = partRepository
                .findByServiceOrderIdOrderByIdAsc(order.getId()).stream()
                .map(item -> new WorkOrderResponse.WorkOrderPartResponse(
                        item.getId(), item.getName(), item.getPartNumber(), item.getQuantity(), item.getUnitPrice()))
                .toList();
        List<WorkOrderResponse.WorkOrderLaborResponse> labor = laborRepository
                .findByServiceOrderIdOrderByIdAsc(order.getId()).stream()
                .map(item -> new WorkOrderResponse.WorkOrderLaborResponse(
                        item.getId(), item.getDescription(), item.getHours(), item.getRate()))
                .toList();

        BigDecimal partsSubtotal = parts.stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal laborSubtotal = labor.stream()
                .map(item -> item.hours().multiply(item.rate()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal supplies = partsSubtotal.multiply(SUPPLIES_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = partsSubtotal.add(laborSubtotal).add(supplies)
                .multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = partsSubtotal.add(laborSubtotal).add(supplies).add(tax)
                .setScale(2, RoundingMode.HALF_UP);

        var vehicle = order.getVehicle();
        String ownerName = vehicle.getClient() == null ? "Propietario no asignado" : vehicle.getClient().getName();
        String diagnosis = order.getDiagnosis();
        if (diagnosis == null || diagnosis.isBlank()) {
            diagnosis = order.getCustomerObservations() == null || order.getCustomerObservations().isBlank()
                    ? order.getPrimaryReason()
                    : order.getCustomerObservations();
        }

        return new WorkOrderResponse(
                order.getId(),
                "SU-" + order.getEntryDate().getYear() + "-" + String.format("%03d", order.getId()),
                order.getStatus() == null ? "EN PROGRESO" : order.getStatus(),
                diagnosis,
                order.getEntryDate(),
                order.getCurrentMileage(),
                order.getPrimaryReason(),
                order.getCustomerObservations(),
                new WorkOrderResponse.WorkOrderVehicleResponse(
                        vehicle.getId(), vehicle.getPlate(), vehicle.getBrand(), vehicle.getModel(),
                        vehicle.getVehicleYear(), ownerName),
                tasks,
                parts,
                labor,
                partsSubtotal.setScale(2, RoundingMode.HALF_UP),
                laborSubtotal.setScale(2, RoundingMode.HALF_UP),
                supplies,
                tax,
                total);
    }
}