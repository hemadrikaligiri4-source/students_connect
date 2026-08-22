package app.studyloop.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<?> index() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("app", "StudyLoop Backend Engine");
        status.put("version", "1.0.0-SNAPSHOT");
        status.put("status", "ONLINE & OPERATIONAL");
        status.put("studentFrontendUrl", "http://localhost:5173/");
        status.put("adminConsoleUrl", "http://localhost:5174/");
        status.put("h2ConsoleUrl", "http://localhost:8080/h2-console");
        status.put("message", "Welcome! The REST API engine is running. Use http://localhost:5173 for the Student UI or http://localhost:5174 for Admin Console.");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
