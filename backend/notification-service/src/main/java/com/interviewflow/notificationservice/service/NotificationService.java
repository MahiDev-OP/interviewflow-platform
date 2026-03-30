package com.interviewflow.notificationservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewflow.notificationservice.notification.NotificationItem;
import com.interviewflow.notificationservice.notification.NotificationRepository;
import com.interviewflow.notificationservice.reminder.ReminderSchedule;
import com.interviewflow.notificationservice.reminder.ReminderScheduleRepository;
import com.interviewflow.notificationservice.security.AuthenticatedUser;
import com.interviewflow.notificationservice.web.dto.NotificationResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ReminderScheduleRepository reminderScheduleRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(
            NotificationRepository notificationRepository,
            ReminderScheduleRepository reminderScheduleRepository,
            ObjectMapper objectMapper
    ) {
        this.notificationRepository = notificationRepository;
        this.reminderScheduleRepository = reminderScheduleRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listNotifications(AuthenticatedUser authenticatedUser) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(authenticatedUser.userId())
                .stream()
                .map(notification -> new NotificationResponse(
                        notification.getId(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getCategory(),
                        notification.isRead(),
                        notification.getCreatedAt()
                ))
                .toList();
    }

    @KafkaListener(topics = "${app.kafka.topics.application-events}")
    @Transactional
    public void onApplicationEvent(String payload) {
        JsonNode root = read(payload);
        String eventType = root.path("eventType").asText();
        String company = root.path("company").asText();
        String role = root.path("role").asText();

        switch (eventType) {
            case "APPLICATION_CREATED" -> createNotification(
                    userId(root),
                    "Application added",
                    company + " - " + role + " is now in your pipeline.",
                    "APPLICATION"
            );
            case "APPLICATION_STATUS_CHANGED" -> createNotification(
                    userId(root),
                    "Stage updated",
                    company + " moved from " + root.path("previousStatus").asText() + " to "
                            + root.path("currentStatus").asText() + ".",
                    "STATUS"
            );
            case "APPLICATION_NOTE_ADDED" -> createNotification(
                    userId(root),
                    "New note saved",
                    "A fresh note was added for " + company + " - " + role + ".",
                    "NOTE"
            );
            default -> {
            }
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.reminder-events}")
    @Transactional
    public void onReminderEvent(String payload) {
        JsonNode root = read(payload);

        ReminderSchedule reminderSchedule = reminderScheduleRepository
                .findById(UUID.fromString(root.path("applicationId").asText()))
                .orElseGet(ReminderSchedule::new);

        reminderSchedule.setApplicationId(UUID.fromString(root.path("applicationId").asText()));
        reminderSchedule.setUserId(userId(root));
        reminderSchedule.setCompany(root.path("company").asText());
        reminderSchedule.setRole(root.path("role").asText());
        reminderSchedule.setReminderAt(Instant.parse(root.path("reminderAt").asText()));
        reminderSchedule.setTriggered(false);

        reminderScheduleRepository.save(reminderSchedule);
    }

    @Scheduled(fixedDelay = 30000L, initialDelay = 30000L)
    @Transactional
    public void triggerDueReminders() {
        List<ReminderSchedule> dueReminders = reminderScheduleRepository
                .findAllByTriggeredFalseAndReminderAtLessThanEqual(Instant.now());

        for (ReminderSchedule reminder : dueReminders) {
            createNotification(
                    reminder.getUserId(),
                    "Follow up reminder",
                    "Time to follow up on " + reminder.getCompany() + " - " + reminder.getRole() + ".",
                    "REMINDER"
            );
            reminder.setTriggered(true);
            reminderScheduleRepository.save(reminder);
        }
    }

    private void createNotification(UUID userId, String title, String message, String category) {
        NotificationItem notificationItem = new NotificationItem();
        notificationItem.setUserId(userId);
        notificationItem.setTitle(title);
        notificationItem.setMessage(message);
        notificationItem.setCategory(category);
        notificationItem.setRead(false);

        notificationRepository.save(notificationItem);
    }

    private JsonNode read(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read Kafka message.", exception);
        }
    }

    private UUID userId(JsonNode root) {
        return UUID.fromString(root.path("userId").asText());
    }
}
