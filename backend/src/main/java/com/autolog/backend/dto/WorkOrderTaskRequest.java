package com.autolog.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkOrderTaskRequest(
        @NotBlank String description,
        boolean completed) {
}