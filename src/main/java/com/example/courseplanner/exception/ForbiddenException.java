package com.example.courseplanner.exception;

/**
 * =========================================================
 * Forbidden Exception
 * 
 * Thrown when a user is authenticated (has valid JWT) but
 * is not authorized to perform the requested action.
 * 
 * Examples:
 * - User tries to delete another user's watcher
 * - User tries to access admin-only endpoints
 * 
 * Results in: 403 Forbidden HTTP response
 * =========================================================
 */
public class ForbiddenException extends RuntimeException {
    
    public ForbiddenException(String message) {
        super(message);
    }
    
    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}