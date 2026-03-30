package com.interviewflow.notificationservice.web.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String title,
        String message,
        String category,
        boolean read,
        Instant createdAt
) {
}
