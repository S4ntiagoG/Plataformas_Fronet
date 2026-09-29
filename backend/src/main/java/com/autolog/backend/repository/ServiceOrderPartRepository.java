package com.autolog.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autolog.backend.model.ServiceOrderPart;

public interface ServiceOrderPartRepository extends JpaRepository<ServiceOrderPart, Long> {
    List<ServiceOrderPart> findByServiceOrderIdOrderByIdAsc(Long serviceOrderId);

    void deleteByServiceOrderId(Long serviceOrderId);
}