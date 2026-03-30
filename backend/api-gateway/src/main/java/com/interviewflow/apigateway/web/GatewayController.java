package com.interviewflow.apigateway.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
public class GatewayController {

    private final WebClient webClient;
    private final String authServiceUrl;
    private final String applicationServiceUrl;
    private final String notificationServiceUrl;

    public GatewayController(
            WebClient webClient,
            @Value("${services.auth.url}") String authServiceUrl,
            @Value("${services.application.url}") String applicationServiceUrl,
            @Value("${services.notification.url}") String notificationServiceUrl
    ) {
        this.webClient = webClient;
        this.authServiceUrl = authServiceUrl;
        this.applicationServiceUrl = applicationServiceUrl;
        this.notificationServiceUrl = notificationServiceUrl;
    }

    @PostMapping("/api/auth/signup")
    public Mono<ResponseEntity<String>> signup(
            @RequestBody String body,
            @RequestHeader HttpHeaders headers
    ) {
        return forward(HttpMethod.POST, authServiceUrl + "/api/auth/signup", headers, body);
    }

    @PostMapping("/api/auth/login")
    public Mono<ResponseEntity<String>> login(
            @RequestBody String body,
            @RequestHeader HttpHeaders headers
    ) {
        return forward(HttpMethod.POST, authServiceUrl + "/api/auth/login", headers, body);
    }

    @GetMapping("/api/auth/me")
    public Mono<ResponseEntity<String>> me(@RequestHeader HttpHeaders headers) {
        return forward(HttpMethod.GET, authServiceUrl + "/api/auth/me", headers, null);
    }

    @GetMapping("/api/applications")
    public Mono<ResponseEntity<String>> listApplications(@RequestHeader HttpHeaders headers) {
        return forward(HttpMethod.GET, applicationServiceUrl + "/api/applications", headers, null);
    }

    @PostMapping("/api/applications")
    public Mono<ResponseEntity<String>> createApplication(
            @RequestBody String body,
            @RequestHeader HttpHeaders headers
    ) {
        return forward(HttpMethod.POST, applicationServiceUrl + "/api/applications", headers, body);
    }

    @PatchMapping("/api/applications/{applicationId}/status")
    public Mono<ResponseEntity<String>> updateStatus(
            @PathVariable String applicationId,
            @RequestBody String body,
            @RequestHeader HttpHeaders headers
    ) {
        return forward(
                HttpMethod.PATCH,
                applicationServiceUrl + "/api/applications/" + applicationId + "/status",
                headers,
                body
        );
    }

    @PostMapping("/api/applications/{applicationId}/notes")
    public Mono<ResponseEntity<String>> addNote(
            @PathVariable String applicationId,
            @RequestBody String body,
            @RequestHeader HttpHeaders headers
    ) {
        return forward(
                HttpMethod.POST,
                applicationServiceUrl + "/api/applications/" + applicationId + "/notes",
                headers,
                body
        );
    }

    @GetMapping("/api/notifications")
    public Mono<ResponseEntity<String>> listNotifications(@RequestHeader HttpHeaders headers) {
        return forward(HttpMethod.GET, notificationServiceUrl + "/api/notifications", headers, null);
    }

    private Mono<ResponseEntity<String>> forward(HttpMethod method, String url, HttpHeaders headers, String body) {
        WebClient.RequestBodySpec request = webClient.method(method).uri(url);
        request.headers(outgoing -> copyHeaders(headers, outgoing));

        if (body != null) {
            return request.bodyValue(body).exchangeToMono(response -> response.toEntity(String.class));
        }

        return request.exchangeToMono(response -> response.toEntity(String.class));
    }

    private void copyHeaders(HttpHeaders incoming, HttpHeaders outgoing) {
        if (incoming.getFirst(HttpHeaders.AUTHORIZATION) != null) {
            outgoing.set(HttpHeaders.AUTHORIZATION, incoming.getFirst(HttpHeaders.AUTHORIZATION));
        }
        if (incoming.getFirst(HttpHeaders.CONTENT_TYPE) != null) {
            outgoing.set(HttpHeaders.CONTENT_TYPE, incoming.getFirst(HttpHeaders.CONTENT_TYPE));
        }
        outgoing.set(HttpHeaders.ACCEPT, "application/json");
    }
}
