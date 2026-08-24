package com.example.courseplanner.service;

import com.example.courseplanner.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    private static final String SUPABASE_URL = "https://supabase.test";
    private static final String ANON_KEY = "test-anon-key";
    private static final String USER_ID = "550e8400-e29b-41d4-a716-446655440000";

    private RestTemplate restTemplate;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        jwtService = new JwtService(restTemplate, SUPABASE_URL, ANON_KEY);
    }

    @Test
    void extractsAUserIdAndForwardsTheBearerTokenToSupabase() {
        respondWith(Map.of("id", USER_ID, "email", "student@sfu.ca", "role", "authenticated"));

        String userId = jwtService.extractUserId("Bearer access-token");

        assertEquals(USER_ID, userId);

        ArgumentCaptor<HttpEntity<?>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
                eq(SUPABASE_URL + "/auth/v1/user"),
                eq(HttpMethod.GET),
                entityCaptor.capture(),
                eq(Map.class)
        );
        assertEquals("Bearer access-token", entityCaptor.getValue().getHeaders().getFirst("Authorization"));
        assertEquals(ANON_KEY, entityCaptor.getValue().getHeaders().getFirst("apikey"));
    }

    @Test
    void rejectsMissingMalformedAndEmptyAuthorizationHeadersBeforeCallingSupabase() {
        assertThrows(IllegalArgumentException.class, () -> jwtService.extractUserId(null));
        assertThrows(IllegalArgumentException.class, () -> jwtService.extractUserId("access-token"));
        assertThrows(IllegalArgumentException.class, () -> jwtService.extractUserId("Bearer "));

        verifyNoInteractions(restTemplate);
    }

    @Test
    void returnsEmailAndRoleFromVerifiedUserData() {
        respondWith(Map.of("id", USER_ID, "email", "student@sfu.ca", "role", "authenticated"));
        assertEquals("student@sfu.ca", jwtService.extractEmail("Bearer access-token"));

        respondWith(Map.of("id", USER_ID, "email", "student@sfu.ca", "role", "authenticated"));
        assertEquals("authenticated", jwtService.extractRole("Bearer access-token"));
    }

    @Test
    void returnsNullForOptionalMissingEmailAndRole() {
        respondWith(Map.of("id", USER_ID));
        assertNull(jwtService.extractEmail("Bearer access-token"));

        respondWith(Map.of("id", USER_ID));
        assertNull(jwtService.extractRole("Bearer access-token"));
    }

    @Test
    void permitsUsersWithTheAdminAppMetadataRole() {
        respondWith(Map.of("id", USER_ID, "app_metadata", Map.of("role", "admin")));

        jwtService.verifyAdmin("Bearer access-token");
    }

    @Test
    void rejectsUsersWithoutTheAdminAppMetadataRole() {
        respondWith(Map.of("id", USER_ID, "app_metadata", Map.of("role", "authenticated")));

        assertThrows(ForbiddenException.class, () -> jwtService.verifyAdmin("Bearer access-token"));
    }

    @Test
    void rejectsUsersWithoutAppMetadata() {
        respondWith(Map.of("id", USER_ID));

        assertThrows(ForbiddenException.class, () -> jwtService.verifyAdmin("Bearer access-token"));
    }

    @Test
    void reportsInvalidOrExpiredTokens() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.UNAUTHORIZED,
                        "Unauthorized",
                        HttpHeaders.EMPTY,
                        new byte[0],
                        StandardCharsets.UTF_8
                ));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> jwtService.extractUserId("Bearer invalid-token")
        );

        assertTrueMessageContains(exception, "JWT token is invalid or expired");
    }

    @Test
    void reportsOtherSupabaseHttpErrors() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Unavailable",
                        HttpHeaders.EMPTY,
                        new byte[0],
                        StandardCharsets.UTF_8
                ));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> jwtService.extractUserId("Bearer access-token")
        );

        assertTrueMessageContains(exception, "JWT verification failed: 503 SERVICE_UNAVAILABLE");
    }

    @Test
    void reportsUnavailableSupabase() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RestClientException("Connection refused"));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> jwtService.extractUserId("Bearer access-token")
        );

        assertTrueMessageContains(exception, "Failed to verify JWT with Supabase: Connection refused");
    }

    @Test
    void rejectsResponsesWithoutAUserId() {
        respondWith(Map.of("email", "student@sfu.ca"));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> jwtService.extractUserId("Bearer access-token")
        );

        assertTrueMessageContains(exception, "User data does not contain 'id' field");
    }

    private void respondWith(Map<String, Object> userData) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(userData, HttpStatus.OK));
    }

    private void assertTrueMessageContains(RuntimeException exception, String expectedMessage) {
        org.junit.jupiter.api.Assertions.assertTrue(exception.getMessage().contains(expectedMessage));
    }
}
