package com.autolog.backend.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.autolog.backend.repository.AdminRepository;
import com.autolog.backend.repository.MecanicoRepository;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final MecanicoRepository mecanicoRepository;

    public DatabaseUserDetailsService(AdminRepository adminRepository, MecanicoRepository mecanicoRepository) {
        this.adminRepository = adminRepository;
        this.mecanicoRepository = mecanicoRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return adminRepository.findByUsuarioIgnoreCase(username)
                .map(admin -> User.withUsername(admin.getUsuario())
                        .password(admin.getPassword())
                        .roles("ADMIN")
                        .build())
                .or(() -> mecanicoRepository.findByCodigoMecanicoIgnoreCase(username)
                        .map(mecanico -> User.withUsername(mecanico.getCodigoMecanico())
                                .password(mecanico.getPassword())
                                .roles("MECHANIC")
                                .build()))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
}