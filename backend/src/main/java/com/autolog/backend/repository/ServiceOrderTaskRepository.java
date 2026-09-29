package com.autolog.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autolog.backend.model.ServiceOrderTask;

public interface ServiceOrderTaskRepository extends JpaRepository<ServiceOrderTask, Long> {
    List<ServiceOrderTask> findByServiceOrderIdOrderByIdAsc(Long serviceOrderId);

    void deleteByServiceOrderId(Long serviceOrderId);
}