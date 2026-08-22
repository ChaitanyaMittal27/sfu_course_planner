package com.example.courseplanner.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI coursePlannerOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("SFU Course Planner API")
                .version("v1")
                .description("Course catalog, offering, analytics, bookmark, and preference API for SFU Course Planner."))
            .components(new Components().addSecuritySchemes(
                "supabaseBearerAuth",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Supabase access token for the signed-in user."
                    )
            ));
    }
}
