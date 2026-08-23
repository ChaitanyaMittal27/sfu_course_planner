package com.example.courseplanner.service;

import com.example.courseplanner.model.CourseSysBrowseResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CourseSysClientTest {

    private RestTemplate restTemplate;
    private CourseSysClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new CourseSysClient(restTemplate);
    }

    @Test
    void mapsAValidCourseSysResponse() {
        Map<String, Object> body = Map.of("data", List.of(
                List.of(
                        "1257",
                        "<a href=\"/browse/info/1257-cmpt-276-d100\">CMPT 276 D100</a>",
                        "Introduction to Software Engineering",
                        "96/100",
                        "Ada Lovelace",
                        "Burnaby"
                )
        ));
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        CourseSysBrowseResult result = client.fetchCourseSections("cmpt", "276", 1257);

        assertEquals("CMPT", result.getDept());
        assertEquals("276", result.getCourseNumber());
        assertEquals(2025, result.getYear());
        assertEquals("fall", result.getSemester());
        assertEquals("Introduction to Software Engineering", result.getTitle());
        assertEquals(1, result.getOfferings().size());
        assertEquals("D100", result.getOfferings().get(0).getSection());
        assertEquals("/browse/info/1257-cmpt-276-d100", result.getOfferings().get(0).getInfoUrl());
        assertEquals("96", result.getOfferings().get(0).getEnrolled());
        assertEquals("100", result.getOfferings().get(0).getCapacity());

        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        verify(restTemplate).getForEntity(uriCaptor.capture(), eq(Map.class));
        assertTrue(uriCaptor.getValue().toString().contains("subject%5B%5D=CMPT"));
        assertTrue(uriCaptor.getValue().toString().contains("number%5B%5D=276"));
        assertTrue(uriCaptor.getValue().toString().contains("semester%5B%5D=1257"));
    }

    @Test
    void returnsAnEmptyResultForEmptyCourseSysData() {
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("data", List.of()), HttpStatus.OK));

        CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);

        assertEmptyResult(result);
    }

    @Test
    void returnsAnEmptyResultWhenCourseSysDoesNotReturnData() {
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("unexpected", List.of()), HttpStatus.OK));

        CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);

        assertEmptyResult(result);
    }

    @Test
    void returnsAnEmptyResultForMalformedCourseSysData() {
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("data", List.of(List.of("incomplete"))), HttpStatus.OK));

        CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);

        assertEmptyResult(result);
    }

    @Test
    void returnsAnEmptyResultForNonOkCourseSysResponses() {
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of(), HttpStatus.SERVICE_UNAVAILABLE));

        CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);

        assertEmptyResult(result);
    }

    @Test
    void returnsAnEmptyResultWhenCourseSysIsUnavailable() {
        when(restTemplate.getForEntity(any(URI.class), eq(Map.class)))
                .thenThrow(new RestClientException("CourseSys unavailable"));

        CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);

        assertEmptyResult(result);
    }

    private void assertEmptyResult(CourseSysBrowseResult result) {
        assertEquals("CMPT", result.getDept());
        assertEquals("276", result.getCourseNumber());
        assertEquals(1257, result.getSemesterCode());
        assertEquals(2025, result.getYear());
        assertEquals("fall", result.getSemester());
        assertTrue(result.getOfferings().isEmpty());
    }
}
