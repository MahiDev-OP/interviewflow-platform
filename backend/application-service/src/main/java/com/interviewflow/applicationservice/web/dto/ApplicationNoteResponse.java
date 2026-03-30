package com.interviewflow.applicationservice.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ApplicationNoteResponse(UUID id, String content, Instant createdAt) {
}
