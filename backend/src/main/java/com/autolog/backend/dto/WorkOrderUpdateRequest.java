package com.autolog.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record WorkOrderUpdateRequest(
        @NotBlank @Pattern(regexp = "LISTO|EN PROGRESO|PENDIENTE") String status,
        String diagnosis,
        List<@Valid WorkOrderTaskRequest> tasks,
        List<@Valid WorkOrderPartRequest> parts,
        List<@Valid WorkOrderLaborRequest> labor) {
}