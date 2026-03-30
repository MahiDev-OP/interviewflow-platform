package com.interviewflow.notificationservice.reminder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderScheduleRepository extends JpaRepository<ReminderSchedule, UUID> {

    List<ReminderSchedule> findAllByTriggeredFalseAndReminderAtLessThanEqual(Instant instant);
}
