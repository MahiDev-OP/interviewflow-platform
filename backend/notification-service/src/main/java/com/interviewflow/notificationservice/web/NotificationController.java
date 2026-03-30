package com.interviewflow.notificationservice.web;

import com.interviewflow.notificationservice.security.AuthenticatedUser;
import com.interviewflow.notificationservice.service.NotificationService;
import com.interviewflow.notificationservice.web.dto.NotificationResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> listNotifications(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return notificationService.listNotifications(authenticatedUser);
    }
}
