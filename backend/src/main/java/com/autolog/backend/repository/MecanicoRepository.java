package com.autolog.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autolog.backend.model.Mecanico;

public interface MecanicoRepository extends JpaRepository<Mecanico, Long> {
    Optional<Mecanico> findByCodigoMecanicoIgnoreCase(String codigoMecanico);
}