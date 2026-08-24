package com.example.courseplanner.controller;

import com.example.courseplanner.exception.ForbiddenException;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.Statement;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = HealthController.class, properties = "RESEND_API_KEY=test-resend-key")
@Import(GlobalExceptionHandler.class)
class HealthControllerTest {

    private static final String AUTH_HEADER = "Bearer admin-token";
    private static final String COURSESYS_URL = "https://coursys.sfu.ca/browse/";
    private static final String COURSEDIGGERS_URL = "https://www.coursediggers.com/";
    private static final String RESEND_URL = "https://api.resend.com/emails";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private DataSource dataSource;

    @MockBean(name = "healthRestTemplate")
    private RestTemplate restTemplate;

    @Test
    void requiresAdminAuthorization() throws Exception {
        doThrow(new ForbiddenException("Access denied: not an admin"))
                .when(jwtService).verifyAdmin(AUTH_HEADER);

        mockMvc.perform(get("/api/admin/health").header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verifyNoInteractions(dataSource, restTemplate);
    }

    @Test
    void reportsTheApiAndUnknownServicesUsingCurrentSemantics() throws Exception {
        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service").value("api"))
                .andExpect(jsonPath("$[0].status").value("up"))
                .andExpect(jsonPath("$[0].latencyMs").value(0));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service").value("unknown"))
                .andExpect(jsonPath("$[0].status").value("down"))
                .andExpect(jsonPath("$[0].url").value("unknown"));
    }

    @Test
    void reportsDatabaseReachability() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.execute("SELECT 1")).thenReturn(true);

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "database"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service").value("database"))
                .andExpect(jsonPath("$[0].status").value("up"))
                .andExpect(jsonPath("$[0].url").value("supabase-postgresql"));

        verify(statement).execute("SELECT 1");
        verify(connection).close();
    }

    @Test
    void reportsDatabaseFailuresAsDown() throws Exception {
        when(dataSource.getConnection()).thenThrow(new java.sql.SQLException("Connection refused"));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "database"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("down"));
    }

    @Test
    void reportsCourseSysAndCourseDiggersReachability() throws Exception {
        when(restTemplate.getForEntity(COURSESYS_URL, String.class))
                .thenReturn(new ResponseEntity<>("ok", HttpStatus.OK));
        when(restTemplate.getForEntity(COURSEDIGGERS_URL, String.class))
                .thenReturn(new ResponseEntity<>("unavailable", HttpStatus.SERVICE_UNAVAILABLE));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "coursesys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("up"));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "coursediggers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("down"));
    }

    @Test
    void reportsExternalRequestFailuresAsDown() throws Exception {
        when(restTemplate.getForEntity(COURSESYS_URL, String.class))
                .thenThrow(new RestClientException("Timed out"));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "coursesys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("down"));
    }

    @Test
    void treatsResendAuthenticationFailuresAsReachableAndUsesTheApiKey() throws Exception {
        when(restTemplate.exchange(eq(RESEND_URL), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.FORBIDDEN,
                        "Forbidden",
                        HttpHeaders.EMPTY,
                        new byte[0],
                        StandardCharsets.UTF_8
                ));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "resend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("up"))
                .andExpect(jsonPath("$[0].url").value("api.resend.com"));

        ArgumentCaptor<HttpEntity<?>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(eq(RESEND_URL), eq(HttpMethod.GET), entityCaptor.capture(), eq(String.class));
        org.junit.jupiter.api.Assertions.assertEquals(
                "Bearer test-resend-key",
                entityCaptor.getValue().getHeaders().getFirst("Authorization")
        );
    }

    @Test
    void reportsResendFailuresAsDownWhenItIsNotAnAuthenticationResponse() throws Exception {
        when(restTemplate.exchange(eq(RESEND_URL), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("Timed out"));

        mockMvc.perform(get("/api/admin/health")
                        .header("Authorization", AUTH_HEADER)
                        .param("service", "resend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("down"));
    }

    @Test
    void returnsAllHealthChecksInDocumentedOrder() throws Exception {
        configureHealthyDatabase();
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(new ResponseEntity<>("ok", HttpStatus.OK));
        when(restTemplate.exchange(eq(RESEND_URL), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("ok", HttpStatus.OK));

        mockMvc.perform(get("/api/admin/health").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service").value("api"))
                .andExpect(jsonPath("$[1].service").value("database"))
                .andExpect(jsonPath("$[2].service").value("coursesys"))
                .andExpect(jsonPath("$[3].service").value("coursediggers"))
                .andExpect(jsonPath("$[4].service").value("resend"));
    }

    private void configureHealthyDatabase() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.execute("SELECT 1")).thenReturn(true);
    }
}
