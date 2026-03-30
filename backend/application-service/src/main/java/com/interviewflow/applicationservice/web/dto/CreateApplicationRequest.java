package com.interviewflow.applicationservice.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public record CreateApplicationRequest(
        @NotBlank @Size(max = 120) String company,
        @NotBlank @Size(max = 160) String role,
        boolean referral,
        @Size(max = 120) String referrerName,
        @NotNull LocalDate appliedDate,
        Instant reminderAt,
        @Size(max = 1000) String initialNote
) {
}
