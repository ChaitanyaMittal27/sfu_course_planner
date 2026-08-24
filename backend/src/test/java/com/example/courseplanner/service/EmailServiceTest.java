package com.example.courseplanner.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private EmailTransport emailTransport;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(emailTransport);
    }

    @Test
    void sendsEscapedContactSubmissionsToSupportWithSenderReplyTo() throws Exception {
        emailService.sendContactFormEmail("<Ada & Bob>", "ada@example.com", "Hello <script>alert(1)</script>");

        EmailTransport.EmailMessage message = capturedMessage();
        assertEquals("support@sfucourseplanner.com", message.to());
        assertEquals("SFU Course Planner <contact@sfucourseplanner.com>", message.from());
        assertEquals("Contact Form: <Ada & Bob>", message.subject());
        assertEquals("ada@example.com", message.replyTo());
        assertTrue(message.htmlBody().contains("&lt;Ada &amp; Bob&gt;"));
        assertTrue(message.htmlBody().contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
    }

    @Test
    void sendsNotificationDigestsWithoutAReplyToAddress() throws Exception {
        emailService.sendNotificationDigest("student@example.com", "Daily update", "<p>Open seats</p>");

        EmailTransport.EmailMessage message = capturedMessage();
        assertEquals("student@example.com", message.to());
        assertEquals("SFU Course Planner <notifications@sfucourseplanner.com>", message.from());
        assertEquals("Daily update", message.subject());
        assertEquals("<p>Open seats</p>", message.htmlBody());
        assertNull(message.replyTo());
    }

    @Test
    void sendsEscapedSupportRepliesWithTheSupportReplyToAddress() throws Exception {
        emailService.sendSupportReply("student@example.com", "Ada <Admin>", "Use <b>this</b> link");

        EmailTransport.EmailMessage message = capturedMessage();
        assertEquals("student@example.com", message.to());
        assertEquals("SFU Course Planner Support <support@sfucourseplanner.com>", message.from());
        assertEquals("Re: Your message to SFU Course Planner", message.subject());
        assertEquals("support@sfucourseplanner.com", message.replyTo());
        assertTrue(message.htmlBody().contains("Ada &lt;Admin&gt;"));
        assertTrue(message.htmlBody().contains("Use &lt;b&gt;this&lt;/b&gt; link"));
    }

    @Test
    void containsTransportFailuresForExistingCallers() throws Exception {
        doThrow(new RuntimeException("Resend unavailable"))
                .when(emailTransport).send(org.mockito.ArgumentMatchers.any());

        emailService.sendNotificationDigest("student@example.com", "Daily update", "<p>Open seats</p>");

        verify(emailTransport).send(org.mockito.ArgumentMatchers.any());
    }

    private EmailTransport.EmailMessage capturedMessage() throws Exception {
        ArgumentCaptor<EmailTransport.EmailMessage> captor = ArgumentCaptor.forClass(EmailTransport.EmailMessage.class);
        verify(emailTransport).send(captor.capture());
        return captor.getValue();
    }
}
