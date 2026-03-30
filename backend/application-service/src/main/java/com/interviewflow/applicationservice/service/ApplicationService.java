package com.interviewflow.applicationservice.service;

import com.interviewflow.applicationservice.application.ApplicationNote;
import com.interviewflow.applicationservice.application.ApplicationStatus;
import com.interviewflow.applicationservice.application.JobApplication;
import com.interviewflow.applicationservice.application.JobApplicationRepository;
import com.interviewflow.applicationservice.events.ApplicationEventPublisher;
import com.interviewflow.applicationservice.security.AuthenticatedUser;
import com.interviewflow.applicationservice.web.dto.AddNoteRequest;
import com.interviewflow.applicationservice.web.dto.ApplicationNoteResponse;
import com.interviewflow.applicationservice.web.dto.ApplicationResponse;
import com.interviewflow.applicationservice.web.dto.CreateApplicationRequest;
import com.interviewflow.applicationservice.web.dto.UpdateStatusRequest;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ApplicationService(JobApplicationRepository jobApplicationRepository, ApplicationEventPublisher eventPublisher) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listApplications(AuthenticatedUser authenticatedUser) {
        return jobApplicationRepository.findAllByUserIdOrderByUpdatedAtDesc(authenticatedUser.userId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApplicationResponse createApplication(AuthenticatedUser authenticatedUser, CreateApplicationRequest request) {
        JobApplication application = new JobApplication();
        application.setUserId(authenticatedUser.userId());
        application.setCompany(request.company().trim());
        application.setRole(request.role().trim());
        application.setReferral(request.referral());
        application.setReferrerName(request.referral() ? trimToNull(request.referrerName()) : null);
        application.setAppliedDate(request.appliedDate());
        application.setStatus(ApplicationStatus.APPLIED);
        application.setReminderAt(request.reminderAt());

        if (trimToNull(request.initialNote()) != null) {
            application.addNote(request.initialNote().trim());
        }

        JobApplication savedApplication = jobApplicationRepository.save(application);

        eventPublisher.publishApplicationCreated(
                authenticatedUser.userId(),
                savedApplication.getId(),
                savedApplication.getCompany(),
                savedApplication.getRole(),
                savedApplication.getStatus().name()
        );
        eventPublisher.publishReminder(
                authenticatedUser.userId(),
                savedApplication.getId(),
                savedApplication.getCompany(),
                savedApplication.getRole(),
                savedApplication.getReminderAt()
        );

        return toResponse(savedApplication);
    }

    @Transactional
    public ApplicationResponse updateStatus(
            AuthenticatedUser authenticatedUser,
            UUID applicationId,
            UpdateStatusRequest request
    ) {
        JobApplication application = getOwnedApplication(authenticatedUser.userId(), applicationId);
        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(request.status());

        JobApplication savedApplication = jobApplicationRepository.save(application);
        eventPublisher.publishStatusChanged(
                authenticatedUser.userId(),
                savedApplication.getId(),
                savedApplication.getCompany(),
                savedApplication.getRole(),
                previousStatus.name(),
                savedApplication.getStatus().name()
        );

        return toResponse(savedApplication);
    }

    @Transactional
    public ApplicationResponse addNote(AuthenticatedUser authenticatedUser, UUID applicationId, AddNoteRequest request) {
        JobApplication application = getOwnedApplication(authenticatedUser.userId(), applicationId);
        application.addNote(request.content().trim());

        JobApplication savedApplication = jobApplicationRepository.save(application);
        eventPublisher.publishNoteAdded(
                authenticatedUser.userId(),
                savedApplication.getId(),
                savedApplication.getCompany(),
                savedApplication.getRole()
        );

        return toResponse(savedApplication);
    }

    private JobApplication getOwnedApplication(UUID userId, UUID applicationId) {
        return jobApplicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));
    }

    private ApplicationResponse toResponse(JobApplication application) {
        List<ApplicationNoteResponse> notes = application.getNotes().stream()
                .sorted(Comparator.comparing(ApplicationNote::getCreatedAt).reversed())
                .map(note -> new ApplicationNoteResponse(note.getId(), note.getContent(), note.getCreatedAt()))
                .toList();

        return new ApplicationResponse(
                application.getId(),
                application.getCompany(),
                application.getRole(),
                application.isReferral(),
                application.getReferrerName(),
                application.getAppliedDate(),
                application.getStatus(),
                application.getReminderAt(),
                application.getCreatedAt(),
                application.getUpdatedAt(),
                notes
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
