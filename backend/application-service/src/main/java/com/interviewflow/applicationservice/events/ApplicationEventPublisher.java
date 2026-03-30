package com.interviewflow.applicationservice.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class ApplicationEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String applicationEventsTopic;
    private final String reminderEventsTopic;

    public ApplicationEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.topics.application-events}") String applicationEventsTopic,
            @Value("${app.kafka.topics.reminder-events}") String reminderEventsTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.applicationEventsTopic = applicationEventsTopic;
        this.reminderEventsTopic = reminderEventsTopic;
    }

    public void publishApplicationCreated(UUID userId, UUID applicationId, String company, String role, String status) {
        publish(applicationEventsTopic, applicationId.toString(), eventPayload(
                "APPLICATION_CREATED",
                userId,
                applicationId,
                company,
                role,
                Map.of("status", status)
        ));
    }

    public void publishStatusChanged(
            UUID userId,
            UUID applicationId,
            String company,
            String role,
            String previousStatus,
            String currentStatus
    ) {
        publish(applicationEventsTopic, applicationId.toString(), eventPayload(
                "APPLICATION_STATUS_CHANGED",
                userId,
                applicationId,
                company,
                role,
                Map.of("previousStatus", previousStatus, "currentStatus", currentStatus)
        ));
    }

    public void publishNoteAdded(UUID userId, UUID applicationId, String company, String role) {
        publish(applicationEventsTopic, applicationId.toString(), eventPayload(
                "APPLICATION_NOTE_ADDED",
                userId,
                applicationId,
                company,
                role,
                Map.of()
        ));
    }

    public void publishReminder(UUID userId, UUID applicationId, String company, String role, Instant reminderAt) {
        if (reminderAt == null) {
            return;
        }

        publish(reminderEventsTopic, applicationId.toString(), eventPayload(
                "APPLICATION_REMINDER_SCHEDULED",
                userId,
                applicationId,
                company,
                role,
                Map.of("reminderAt", reminderAt.toString())
        ));
    }

    private Map<String, Object> eventPayload(
            String eventType,
            UUID userId,
            UUID applicationId,
            String company,
            String role,
            Map<String, Object> extra
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", eventType);
        payload.put("userId", userId.toString());
        payload.put("applicationId", applicationId.toString());
        payload.put("company", company);
        payload.put("role", role);
        payload.put("timestamp", Instant.now().toString());
        payload.putAll(extra);
        return payload;
    }

    private void publish(String topic, String key, Map<String, Object> payload) {
        try {
            kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to publish Kafka event.", exception);
        }
    }
}
