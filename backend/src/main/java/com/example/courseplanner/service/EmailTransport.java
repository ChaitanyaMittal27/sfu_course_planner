package com.example.courseplanner.service;

public interface EmailTransport {

    void send(EmailMessage message) throws Exception;

    record EmailMessage(String to, String from, String subject, String htmlBody, String replyTo) {}
}
