package com.example.courseplanner.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ResendEmailTransport implements EmailTransport {

    private final String resendApiKey;

    public ResendEmailTransport(@Value("${RESEND_API_KEY}") String resendApiKey) {
        this.resendApiKey = resendApiKey;
    }

    @Override
    public void send(EmailMessage message) throws Exception {
        CreateEmailOptions.Builder builder = CreateEmailOptions.builder()
                .from(message.from())
                .to(message.to())
                .subject(message.subject())
                .html(message.htmlBody());

        if (message.replyTo() != null) {
            builder.replyTo(message.replyTo());
        }

        new Resend(resendApiKey).emails().send(builder.build());
    }
}
