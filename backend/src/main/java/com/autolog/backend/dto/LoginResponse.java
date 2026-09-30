package com.autolog.backend.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds) {
}