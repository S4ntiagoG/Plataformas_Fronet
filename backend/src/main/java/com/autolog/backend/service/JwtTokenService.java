package com.autolog.backend.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final Duration tokenLifetime;

    public JwtTokenService(
            JwtEncoder jwtEncoder,
            @Value("${autolog.auth.token-lifetime-minutes:60}") long tokenLifetimeMinutes) {
        this.jwtEncoder = jwtEncoder;
        this.tokenLifetime = Duration.ofMinutes(tokenLifetimeMinutes);
    }

    public String createToken(String username) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("autolog")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(tokenLifetime))
                .subject(username)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long getTokenLifetimeSeconds() {
        return tokenLifetime.toSeconds();
    }
}