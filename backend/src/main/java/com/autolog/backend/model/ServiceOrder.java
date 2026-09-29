package com.autolog.backend.model;

import java.time.LocalDate;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "service_orders")
@Getter
@Setter
@NoArgsConstructor
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate entryDate; // Fecha de entrada

    @Column(nullable = false)
    private String primaryReason; // Razón principal de visita / diagnóstico

    @Column(nullable = false)
    private Integer currentMileage; // Kilometraje actual (KM/MI)

    @Column(length = 30)
    private String status = "EN PROGRESO";

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(precision = 12, scale = 2)
    private BigDecimal serviceCost; // Costo total registrado para el mantenimiento

    @Column(columnDefinition = "TEXT")
    private String customerObservations; // Observaciones y comentarios del cliente

    // Rutas o nombres de los archivos de las 5 fotos de evidencia
    private String photoFront;          // Frente
    private String photoRightSide;      // Lateral derecho
    private String photoBack;           // Trasera
    private String photoOdometer;       // Odómetro
    private String photoExtra;          // Foto adicional / estado

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle; // Relación con el vehículo que ingresa al taller
}