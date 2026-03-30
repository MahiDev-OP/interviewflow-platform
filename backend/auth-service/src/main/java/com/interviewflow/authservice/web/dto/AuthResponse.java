package com.interviewflow.authservice.web.dto;

public record AuthResponse(String token, CurrentUserResponse user) {
}
