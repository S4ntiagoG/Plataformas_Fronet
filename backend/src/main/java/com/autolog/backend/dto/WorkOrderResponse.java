package com.autolog.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record WorkOrderResponse(
        Long id,
        String orderNumber,
        String status,
        String diagnosis,
        LocalDate entryDate,
        Integer currentMileage,
        String primaryReason,
        String customerObservations,
        WorkOrderVehicleResponse vehicle,
        List<WorkOrderTaskResponse> tasks,
        List<WorkOrderPartResponse> parts,
        List<WorkOrderLaborResponse> labor,
        BigDecimal partsSubtotal,
        BigDecimal laborSubtotal,
        BigDecimal supplies,
        BigDecimal tax,
        BigDecimal total) {

    public record WorkOrderVehicleResponse(
            Long id,
            String plate,
            String brand,
            String model,
            Integer vehicleYear,
            String ownerName) {
    }

    public record WorkOrderTaskResponse(Long id, String description, boolean completed) {
    }

    public record WorkOrderPartResponse(
            Long id,
            String name,
            String partNumber,
            Integer quantity,
            BigDecimal unitPrice) {
    }

    public record WorkOrderLaborResponse(
            Long id,
            String description,
            BigDecimal hours,
            BigDecimal rate) {
    }
}