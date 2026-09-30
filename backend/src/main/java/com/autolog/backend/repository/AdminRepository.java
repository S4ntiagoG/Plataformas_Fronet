package com.autolog.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autolog.backend.model.Admin;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsuarioIgnoreCase(String usuario);
}