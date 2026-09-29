package com.autolog.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.autolog.backend.dto.WorkOrderLaborRequest;
import com.autolog.backend.dto.WorkOrderPartRequest;
import com.autolog.backend.dto.WorkOrderTaskRequest;
import com.autolog.backend.dto.WorkOrderUpdateRequest;
import com.autolog.backend.model.ServiceOrder;
import com.autolog.backend.model.Vehicle;
import com.autolog.backend.repository.ServiceOrderLaborRepository;
import com.autolog.backend.repository.ServiceOrderPartRepository;
import com.autolog.backend.repository.ServiceOrderRepository;
import com.autolog.backend.repository.ServiceOrderTaskRepository;
import com.autolog.backend.repository.VehicleRepository;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceTest {

    @Mock
    private ServiceOrderRepository serviceOrderRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private ServiceOrderTaskRepository taskRepository;
    @Mock
    private ServiceOrderPartRepository partRepository;
    @Mock
    private ServiceOrderLaborRepository laborRepository;

    @InjectMocks
    private WorkOrderService workOrderService;

    @Test
    void createsAWorkOrderWhenTheVehicleHasNoServiceOrder() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(7L);
        vehicle.setPlate("ABC123");
        vehicle.setBrand("Toyota");
        vehicle.setModel("Corolla");
        vehicle.setVehicleYear(2022);
        when(serviceOrderRepository.findFirstByVehicleIdOrderByEntryDateDescIdDesc(7L))
                .thenReturn(Optional.empty());
        when(vehicleRepository.findById(7L)).thenReturn(Optional.of(vehicle));
        when(serviceOrderRepository.save(any(ServiceOrder.class))).thenAnswer(invocation -> {
            ServiceOrder saved = invocation.getArgument(0);
            saved.setId(41L);
            return saved;
        });

        var result = workOrderService.getOrCreateForVehicle(7L);

        assertTrue(result.isPresent());
        assertEquals(41L, result.get().id());
        assertEquals("EN PROGRESO", result.get().status());
        assertEquals("ABC123", result.get().vehicle().plate());
    }

    @Test
    void updatesWorkDetailsAndCalculatesTheTotal() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(7L);
        vehicle.setPlate("ABC123");
        vehicle.setBrand("Toyota");
        vehicle.setModel("Corolla");
        vehicle.setVehicleYear(2022);

        ServiceOrder order = new ServiceOrder();
        order.setId(31L);
        order.setEntryDate(LocalDate.of(2026, 9, 29));
        order.setPrimaryReason("Ruido al frenar");
        order.setCurrentMileage(12000);
        order.setVehicle(vehicle);
        when(serviceOrderRepository.findById(31L)).thenReturn(Optional.of(order));

        WorkOrderUpdateRequest request = new WorkOrderUpdateRequest(
                "LISTO",
                "Pastillas desgastadas",
                List.of(new WorkOrderTaskRequest("Inspeccionar frenos", true)),
                List.of(new WorkOrderPartRequest("Pastillas", "P-1", 2, new BigDecimal("100.00"))),
                List.of(new WorkOrderLaborRequest("Instalación", new BigDecimal("3.00"), new BigDecimal("50.00"))));

        var result = workOrderService.update(31L, request);

        assertTrue(result.isPresent());
        assertEquals("LISTO", order.getStatus());
        assertEquals("Pastillas desgastadas", order.getDiagnosis());
        assertEquals(new BigDecimal("390.60"), order.getServiceCost());
        verify(taskRepository).deleteByServiceOrderId(31L);
        verify(partRepository).deleteByServiceOrderId(31L);
        verify(laborRepository).deleteByServiceOrderId(31L);
    }
}