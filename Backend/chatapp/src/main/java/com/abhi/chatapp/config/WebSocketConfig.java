package com.abhi.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.security.messaging.access.intercept.AuthorizationChannelInterceptor;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.security.authorization.AuthenticatedAuthorizationManager;
import org.springframework.security.core.authority.AuthorityUtils;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtDecoder jwtDecoder;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat")
               .setAllowedOrigins("http://localhost:5173")
               .withSockJS()
               .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
               .setWebSocketEnabled(true)
               .setSessionCookieNeeded(false)
               .setDisconnectDelay(30 * 1000)
               .setHeartbeatTime(25 * 1000)
               .setStreamBytesLimit(512 * 1024)
               .setHttpMessageCacheSize(1000);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                String sessionId = accessor.getSessionId();
                StompCommand command = accessor.getCommand();
                System.out.println("[WebSocket] preSend: Command=" + command + ", SessionId=" + sessionId);
                System.out.println("[WebSocket] preSend: User=" + accessor.getUser());
                if (accessor.getSessionAttributes() != null) {
                    Object auth = accessor.getSessionAttributes().get("SPRING.AUTHENTICATION");
                    System.out.println("[WebSocket] preSend: SPRING.AUTHENTICATION=" + auth);
                } else {
                    System.out.println("[WebSocket] preSend: No session attributes");
                }

                if (StompCommand.CONNECT.equals(command)) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    System.out.println("Received WebSocket connection request");

                    if (token != null && token.startsWith("Bearer ")) {
                        try {
                            token = token.substring(7);
                            System.out.println("Processing token for WebSocket connection");
                            Jwt jwt = jwtDecoder.decode(token);
                            JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, AuthorityUtils.createAuthorityList("ROLE_USER"));

                            // Store authentication in session attributes
                            accessor.setUser(auth);
                            if (accessor.getSessionAttributes() != null) {
                                accessor.getSessionAttributes().put("SPRING.AUTHENTICATION", auth);
                            }

                            // Set SecurityContext for this thread
                            SecurityContext context = new SecurityContextImpl();
                            context.setAuthentication(auth);
                            SecurityContextHolder.setContext(context);

                            System.out.println("[WebSocket] CONNECT: Authenticated user=" + jwt.getSubject());
                            return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
                        } catch (Exception e) {
                            System.err.println("WebSocket authentication failed: " + e.getMessage());
                            e.printStackTrace();

                            // Add error header for debugging
                            accessor.setHeader("X-Auth-Error", e.getMessage());
                            return null;
                        }
                    } else {
                        System.err.println("No valid Authorization header found in WebSocket connection");
                        accessor.setHeader("X-Auth-Error", "No valid Authorization header");
                        return null;
                    }
                } else {
                    // For SUBSCRIBE/SEND/etc: restore authentication from session
                    if (accessor.getSessionAttributes() != null) {
                        Object auth = accessor.getSessionAttributes().get("SPRING.AUTHENTICATION");
                        if (auth instanceof JwtAuthenticationToken) {
                            accessor.setUser((JwtAuthenticationToken) auth);

                            // Set SecurityContext for this thread
                            SecurityContext context = new SecurityContextImpl();
                            context.setAuthentication((JwtAuthenticationToken) auth);
                            SecurityContextHolder.setContext(context);
                            System.out.println("[WebSocket] " + command + ": Restored authentication for user=" + ((JwtAuthenticationToken) auth).getName());
                        } else {
                            System.out.println("[WebSocket] " + command + ": No valid authentication in session attributes");
                        }
                    } else {
                        System.out.println("[WebSocket] " + command + ": No session attributes");
                    }
                }
                return message;
            }
        });

        // Configure authorization
        MessageMatcherDelegatingAuthorizationManager.Builder messages = MessageMatcherDelegatingAuthorizationManager.builder();
        messages
            .simpDestMatchers("/app/**").authenticated()  // Require authentication for /app/**
            .simpSubscribeDestMatchers("/topic/**").authenticated()  // Require authentication for /topic/**
            .anyMessage().permitAll();  // Allow all other messages

        registration.interceptors(new AuthorizationChannelInterceptor(messages.build()));
    }
}
