package com.interviewflow.applicationservice.web;

import com.interviewflow.applicationservice.security.AuthenticatedUser;
import com.interviewflow.applicationservice.service.ApplicationService;
import com.interviewflow.applicationservice.web.dto.AddNoteRequest;
import com.interviewflow.applicationservice.web.dto.ApplicationResponse;
import com.interviewflow.applicationservice.web.dto.CreateApplicationRequest;
import com.interviewflow.applicationservice.web.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<ApplicationResponse> listApplications(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return applicationService.listApplications(authenticatedUser);
    }

    @PostMapping
    public ApplicationResponse createApplication(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateApplicationRequest request
    ) {
        return applicationService.createApplication(authenticatedUser, request);
    }

    @PatchMapping("/{applicationId}/status")
    public ApplicationResponse updateStatus(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID applicationId,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return applicationService.updateStatus(authenticatedUser, applicationId, request);
    }

    @PostMapping("/{applicationId}/notes")
    public ApplicationResponse addNote(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable UUID applicationId,
            @Valid @RequestBody AddNoteRequest request
    ) {
        return applicationService.addNote(authenticatedUser, applicationId, request);
    }
}
