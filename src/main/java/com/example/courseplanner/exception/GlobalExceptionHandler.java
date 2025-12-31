package com.example.courseplanner.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * =========================================================
 * Global Exception Handler
 * 
 * Catches exceptions thrown by controllers and JWT service,
 * converting them into proper HTTP error responses.
 * 
 * HTTP Status Codes:
 * - 401 Unauthorized: Missing, invalid, or expired JWT
 * - 403 Forbidden: Valid JWT but insufficient permissions
 * - 400 Bad Request: Malformed request data
 * =========================================================
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles JWT authentication failures.
     * 
     * Returns 401 Unauthorized for:
     * - Missing Authorization header
     * - Invalid JWT signature
     * - Expired JWT token
     * - Malformed JWT
     */
    @ExceptionHandler({
        IllegalArgumentException.class,
        RuntimeException.class
    })
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(Exception ex) {
        // Check if this is a JWT-related error
        String message = ex.getMessage();
        
        if (message != null && (
            message.contains("Authorization header") ||
            message.contains("JWT") ||
            message.contains("token")
        )) {
            return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed",
                message
            );
        }
        
        // If not JWT-related, return 400 Bad Request
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Bad request",
            message
        );
    }

    /**
     * Handles authorization failures (valid user, but not allowed).
     * 
     * Returns 403 Forbidden for:
     * - Trying to access another user's resources
     * - Insufficient permissions
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbiddenException(ForbiddenException ex) {
        return buildErrorResponse(
            HttpStatus.FORBIDDEN,
            "Access denied",
            ex.getMessage()
        );
    }

    /**
     * Builds a standardized error response.
     * 
     * Response format:
     * {
     *   "timestamp": "2025-12-30T12:00:00",
     *   "status": 401,
     *   "error": "Unauthorized",
     *   "message": "JWT token has expired"
     * }
     */
    private ResponseEntity<Map<String, Object>> buildErrorResponse(
        HttpStatus status,
        String error,
        String message
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        
        return new ResponseEntity<>(body, status);
    }
}