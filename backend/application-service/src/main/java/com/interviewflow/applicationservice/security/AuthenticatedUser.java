package com.interviewflow.applicationservice.security;

import java.util.UUID;

public record AuthenticatedUser(UUID userId, String email, String name) {
}
