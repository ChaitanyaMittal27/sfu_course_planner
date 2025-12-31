package com.example.courseplanner.controller;

import com.example.courseplanner.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestController {

    private final JwtService jwtService;

    public TestController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Test JWT verification endpoint.
     * 
     * Test with Postman:
     * GET http://localhost:5000/api/test-jwt
     * Header: Authorization: Bearer YOUR_JWT
     */
    @GetMapping("/test-jwt")
    public ResponseEntity<Map<String, String>> testJwt(
        @RequestHeader("Authorization") String authHeader
    ) {
        try {
            // Verify JWT and extract userId
            String userId = jwtService.extractUserId(authHeader);
            
            Map<String, String> response = new HashMap<>();
            response.put("userId", userId);
            response.put("message", "JWT verified via Supabase API!");
            response.put("method", "API Call Verification");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "JWT verification failed");
            error.put("message", e.getMessage());
            
            return ResponseEntity.status(401).body(error);
        }
    }

    /**
     * Test without JWT (should fail).
     */
    @GetMapping("/test-no-jwt")
    public ResponseEntity<Map<String, String>> testNoJwt(
        @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || authHeader.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "No JWT provided");
            error.put("message", "Authorization header required");
            
            return ResponseEntity.status(401).body(error);
        }
        
        return testJwt(authHeader);
    }
}