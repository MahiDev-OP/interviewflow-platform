package com.interviewflow.authservice.web.dto;

import java.util.UUID;

public record CurrentUserResponse(UUID id, String name, String email) {
}
