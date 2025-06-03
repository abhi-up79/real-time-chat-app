package com.abhi.chatapp.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class AudienceValidator implements OAuth2TokenValidator<Jwt> {
    private final String audience;

    public AudienceValidator(String audience) {
        this.audience = audience;
        System.out.println("Initializing AudienceValidator with audience: " + audience);
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        System.out.println("\n=== JWT Token Validation ===");
        System.out.println("Token audience: " + jwt.getAudience());
        System.out.println("Expected audience: " + audience);
        System.out.println("Token claims: " + jwt.getClaims());
        System.out.println("Token issuer: " + jwt.getIssuer());
        System.out.println("Token subject: " + jwt.getSubject());
        System.out.println("Token headers: " + jwt.getHeaders());
        System.out.println("Token expires at: " + jwt.getExpiresAt());
        System.out.println("Token issued at: " + jwt.getIssuedAt());
        System.out.println("Token not before: " + jwt.getNotBefore());
        
        // Check if any of the token's audiences match the expected audience
        boolean isValid = jwt.getAudience().stream()
            .anyMatch(tokenAudience -> {
                System.out.println("Comparing token audience: " + tokenAudience + " with expected: " + audience);
                return tokenAudience.equals(audience);
            });
        
        if (isValid) {
            System.out.println("Token validation successful");
            return OAuth2TokenValidatorResult.success();
        }

        System.out.println("Token validation failed - audience mismatch");
        OAuth2Error error = new OAuth2Error("invalid_token", "The required audience is missing", null);
        return OAuth2TokenValidatorResult.failure(error);
    }
} 