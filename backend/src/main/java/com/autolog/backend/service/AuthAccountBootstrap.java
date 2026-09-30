package com.autolog.backend.service;

import java.util.List;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.autolog.backend.model.Admin;
import com.autolog.backend.model.Mecanico;
import com.autolog.backend.repository.AdminRepository;
import com.autolog.backend.repository.MecanicoRepository;

@Component
public class AuthAccountBootstrap implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final MecanicoRepository mecanicoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final String bootstrapAdminUsername;
    private final String bootstrapAdminPassword;
    private final String demoMechanicsJson;

    public AuthAccountBootstrap(
            AdminRepository adminRepository,
            MecanicoRepository mecanicoRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            @Value("${autolog.auth.bootstrap-admin-username:}") String bootstrapAdminUsername,
            @Value("${autolog.auth.bootstrap-admin-password:}") String bootstrapAdminPassword,
            @Value("${autolog.auth.demo-mechanics:[]}") String demoMechanicsJson) {
        this.adminRepository = adminRepository;
        this.mecanicoRepository = mecanicoRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.bootstrapAdminUsername = bootstrapAdminUsername;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
        this.demoMechanicsJson = demoMechanicsJson;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        provisionBootstrapAdmin();
        provisionDemoMechanics();
        adminRepository.findAll().forEach(admin -> {
            if (isLegacyPassword(admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(admin.getPassword()));
            }
        });
        mecanicoRepository.findAll().forEach(mecanico -> {
            if (isLegacyPassword(mecanico.getPassword())) {
                mecanico.setPassword(passwordEncoder.encode(mecanico.getPassword()));
            }
        });
    }

    private void provisionBootstrapAdmin() {
        if (bootstrapAdminUsername.isBlank() && bootstrapAdminPassword.isBlank()) {
            return;
        }
        if (bootstrapAdminUsername.isBlank() || bootstrapAdminPassword.isBlank()) {
            throw new IllegalStateException("Set both AUTOLOG_AUTH_USERNAME and AUTOLOG_AUTH_PASSWORD.");
        }

        adminRepository.findByUsuarioIgnoreCase(bootstrapAdminUsername).orElseGet(() -> {
            Admin admin = new Admin();
            admin.setUsuario(bootstrapAdminUsername);
            admin.setPassword(passwordEncoder.encode(bootstrapAdminPassword));
            return adminRepository.save(admin);
        });
    }

    private void provisionDemoMechanics() {
        List<DemoMechanicAccount> accounts;
        try {
            accounts = objectMapper.readValue(demoMechanicsJson, new TypeReference<>() { });
        } catch (JacksonException exception) {
            throw new IllegalStateException("AUTOLOG_DEMO_MECHANICS must contain a JSON array of mechanic accounts.", exception);
        }

        for (DemoMechanicAccount account : accounts) {
            if (account.codigoMecanico() == null || account.codigoMecanico().isBlank()
                    || account.nombre() == null || account.nombre().isBlank()
                    || account.password() == null || account.password().isBlank()) {
                throw new IllegalStateException("Each demo mechanic requires codigoMecanico, nombre, and password.");
            }

            mecanicoRepository.findByCodigoMecanicoIgnoreCase(account.codigoMecanico()).orElseGet(() -> {
                Mecanico mecanico = new Mecanico();
                mecanico.setCodigoMecanico(account.codigoMecanico());
                mecanico.setNombre(account.nombre());
                mecanico.setPassword(passwordEncoder.encode(account.password()));
                return mecanicoRepository.save(mecanico);
            });
        }
    }

    private boolean isLegacyPassword(String password) {
        return !(password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"));
    }

    private record DemoMechanicAccount(String codigoMecanico, String nombre, String password) {
    }
}