package com.interviewflow.notificationservice.notification;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationItem, UUID> {

    List<NotificationItem> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
