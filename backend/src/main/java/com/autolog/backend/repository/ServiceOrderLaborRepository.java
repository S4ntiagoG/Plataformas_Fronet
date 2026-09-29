package com.autolog.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autolog.backend.model.ServiceOrderLabor;

public interface ServiceOrderLaborRepository extends JpaRepository<ServiceOrderLabor, Long> {
    List<ServiceOrderLabor> findByServiceOrderIdOrderByIdAsc(Long serviceOrderId);

    void deleteByServiceOrderId(Long serviceOrderId);
}