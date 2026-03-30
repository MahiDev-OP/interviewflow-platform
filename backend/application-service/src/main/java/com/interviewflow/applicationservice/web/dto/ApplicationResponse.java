package com.interviewflow.applicationservice.web.dto;

import com.interviewflow.applicationservice.application.ApplicationStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        String company,
        String role,
        boolean referral,
        String referrerName,
        LocalDate appliedDate,
        ApplicationStatus status,
        Instant reminderAt,
        Instant createdAt,
        Instant updatedAt,
        List<ApplicationNoteResponse> notes
) {
}
