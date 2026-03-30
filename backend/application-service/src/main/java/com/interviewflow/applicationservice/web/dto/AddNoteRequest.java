package com.interviewflow.applicationservice.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddNoteRequest(@NotBlank @Size(max = 1000) String content) {
}
