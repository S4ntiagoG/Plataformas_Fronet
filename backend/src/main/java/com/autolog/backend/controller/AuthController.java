package com.autolog.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autolog.backend.dto.LoginRequest;
import com.autolog.backend.dto.LoginResponse;
import com.autolog.backend.service.JwtTokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenService jwtTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
            LoginResponse response = new LoginResponse(
                    jwtTokenService.createToken(authentication.getName()),
                    "Bearer",
                    jwtTokenService.getTokenLifetimeSeconds());
            return ResponseEntity.ok(response);
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}