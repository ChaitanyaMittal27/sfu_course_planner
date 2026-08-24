package com.example.courseplanner.scheduler;

import com.example.courseplanner.entity.UserPreference;
import com.example.courseplanner.model.CourseSysBrowseResult;
import com.example.courseplanner.model.CourseSysOffering;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.repository.BookmarkWithCourseInfo;
import com.example.courseplanner.repository.UserPreferenceRepository;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    @Mock
    private BookmarkRepository bookmarkRepository;

    @Mock
    private CourseSysClient courseSysClient;

    @Mock
    private EmailService emailService;

    private NotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new NotificationScheduler(
                userPreferenceRepository, bookmarkRepository, courseSysClient, emailService
        );
    }

    @Test
    void returnsImmediatelyWhenNobodyHasOptedIn() {
        when(userPreferenceRepository.findAllWithNotificationsEnabled()).thenReturn(List.of());

        NotificationScheduler.NotificationResult result = scheduler.sendDailyNotifications();

        assertEquals(0, result.usersFound());
        assertEquals(0, result.bookmarksFound());
        assertEquals(0, result.emailsSent());
        verifyNoInteractions(bookmarkRepository, courseSysClient, emailService);
    }

    @Test
    void returnsWhenOptedInUsersHaveNoBookmarks() {
        UserPreference user = user("student@example.com");
        when(userPreferenceRepository.findAllWithNotificationsEnabled()).thenReturn(List.of(user));
        when(bookmarkRepository.findAllByUserIdsWithCourseInfo(new String[]{user.getUserId().toString()}))
                .thenReturn(List.of());

        NotificationScheduler.NotificationResult result = scheduler.sendDailyNotifications();

        assertEquals(1, result.usersFound());
        assertEquals(0, result.bookmarksFound());
        assertEquals(0, result.emailsSent());
        verifyNoInteractions(courseSysClient, emailService);
        verify(userPreferenceRepository, never()).saveAll(List.of(user));
    }

    @Test
    void deduplicatesOfferingLookupsAndSendsOneDigestPerBookmarkedUser() {
        UserPreference firstUser = user("first@example.com");
        UserPreference secondUser = user("second@example.com");
        List<UserPreference> users = List.of(firstUser, secondUser);
        List<BookmarkWithCourseInfo> bookmarks = List.of(
                bookmark(firstUser.getUserId(), "D100"),
                bookmark(secondUser.getUserId(), "D100")
        );
        when(userPreferenceRepository.findAllWithNotificationsEnabled()).thenReturn(users);
        when(bookmarkRepository.findAllByUserIdsWithCourseInfo(new String[]{
                firstUser.getUserId().toString(), secondUser.getUserId().toString()
        })).thenReturn(bookmarks);
        when(courseSysClient.fetchCourseSections("CMPT", "225", 1257L)).thenReturn(courseSysResult("D100", "96", "100"));

        NotificationScheduler.NotificationResult result = scheduler.sendDailyNotifications();

        assertEquals(2, result.usersFound());
        assertEquals(2, result.bookmarksFound());
        assertEquals(1, result.uniqueOfferingsFound());
        assertEquals(2, result.emailsSent());
        assertEquals(List.of("CMPT-225-1257"), result.offeringsFetched());
        assertEquals(List.of("first@example.com", "second@example.com"), result.emailsSentTo());
        verify(courseSysClient, times(1)).fetchCourseSections("CMPT", "225", 1257L);
        verify(emailService).sendNotificationDigest(eq("first@example.com"), anyString(), contains("Almost Full"));
        verify(emailService).sendNotificationDigest(eq("second@example.com"), anyString(), contains("Almost Full"));
        verify(userPreferenceRepository).saveAll(users);
        assertNotNull(firstUser.getLastNotifiedAt());
        assertNotNull(secondUser.getLastNotifiedAt());
    }

    @Test
    void sendsAnUnknownStatusWhenAnOfferingLookupFails() {
        UserPreference user = user("student@example.com");
        BookmarkWithCourseInfo bookmark = bookmark(user.getUserId(), "D100");
        when(userPreferenceRepository.findAllWithNotificationsEnabled()).thenReturn(List.of(user));
        when(bookmarkRepository.findAllByUserIdsWithCourseInfo(new String[]{user.getUserId().toString()}))
                .thenReturn(List.of(bookmark));
        when(courseSysClient.fetchCourseSections("CMPT", "225", 1257L))
                .thenThrow(new RuntimeException("CourseSys unavailable"));

        NotificationScheduler.NotificationResult result = scheduler.sendDailyNotifications();

        assertEquals(1, result.emailsSent());
        assertEquals(List.of("CMPT-225-1257"), result.failedOfferings());
        verify(emailService).sendNotificationDigest(eq("student@example.com"), anyString(), contains("Unknown"));
        verify(userPreferenceRepository).saveAll(List.of(user));
    }

    private UserPreference user(String email) {
        UserPreference user = new UserPreference(UUID.randomUUID(), true);
        user.setUserEmail(email);
        user.setCreatedAt(Instant.now());
        return user;
    }

    private BookmarkWithCourseInfo bookmark(UUID userId, String section) {
        return new BookmarkWithCourseInfo() {
            public Long getBookmarkId() { return 1L; }
            public String getUserId() { return userId.toString(); }
            public Long getDeptId() { return 14L; }
            public Long getCourseId() { return 3998L; }
            public Long getSemesterCode() { return 1257L; }
            public String getSection() { return section; }
            public String getDeptCode() { return "CMPT"; }
            public String getCourseNumber() { return "225"; }
            public String getTitle() { return "Data Structures"; }
        };
    }

    private CourseSysBrowseResult courseSysResult(String section, String enrolled, String capacity) {
        CourseSysOffering offering = new CourseSysOffering();
        offering.setSection(section);
        offering.setEnrolled(enrolled);
        offering.setCapacity(capacity);

        CourseSysBrowseResult result = new CourseSysBrowseResult();
        result.setOfferings(List.of(offering));
        return result;
    }
}
