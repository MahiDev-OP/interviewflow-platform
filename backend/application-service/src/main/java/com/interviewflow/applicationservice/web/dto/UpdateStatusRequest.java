package com.interviewflow.applicationservice.web.dto;

import com.interviewflow.applicationservice.application.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull ApplicationStatus status) {
}
