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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import java.util.Collections;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Autowired
    private JwtDecoder jwtDecoder;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for in-memory messaging
        config.enableSimpleBroker("/topic", "/queue", "/user");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
               .setAllowedOrigins("http://localhost:5173", "http://localhost", "http://localhost:80")
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
            private JwtAuthenticationToken getAuthenticationFromAccessor(StompHeaderAccessor accessor) {
                if (accessor.getUser() instanceof JwtAuthenticationToken) {
                    return (JwtAuthenticationToken) accessor.getUser();
                }
                return null;
            }

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                logger.debug("Processing STOMP message: command={}, destination={}, headers={}",
                    accessor.getCommand(), accessor.getDestination(), accessor.toNativeHeaderMap());

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                        try {
                            Jwt jwt = jwtDecoder.decode(token);
                            JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList(), jwt.getSubject());
                            SecurityContext context = new SecurityContextImpl(auth);
                            SecurityContextHolder.setContext(context);
                            accessor.setUser(auth);
                            logger.debug("CONNECT: Successfully authenticated user: {}. isAuthenticated: {}. SecurityContextHolder updated.", auth.getName(), auth.isAuthenticated());
                        } catch (Exception e) {
                            logger.error("CONNECT: Error processing JWT token: {}", e.getMessage(), e);
                            return null;
                        }
                    } else {
                        logger.warn("CONNECT: No valid Authorization header found.");
                        return null;
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) || 
                          StompCommand.SEND.equals(accessor.getCommand())) {
                    // Restore authentication from session if available
                    JwtAuthenticationToken sessionAuth = getAuthenticationFromAccessor(accessor);
                    if (sessionAuth != null) {
                        SecurityContext context = new SecurityContextImpl(sessionAuth);
                        SecurityContextHolder.setContext(context);
                        logger.debug("{}: Restored authentication for user: {}. isAuthenticated: {}", 
                                   accessor.getCommand(), sessionAuth.getName(), sessionAuth.isAuthenticated());
                    } else {
                        logger.error("{}: No authentication found in session", accessor.getCommand());
                        return null;
                    }
                }

                // Diagnostic log at the end of preSend for all commands
                Authentication authInHolder = SecurityContextHolder.getContext().getAuthentication();
                if (authInHolder != null) {
                    logger.debug("Exiting preSend for command {}. Auth in SCH: name={}, isAuthenticated={}, type={}",
                        accessor.getCommand(), authInHolder.getName(), authInHolder.isAuthenticated(), authInHolder.getClass().getName());
                } else {
                    logger.debug("Exiting preSend for command {}. Auth in SCH is NULL.", accessor.getCommand());
                }
                return message;
            }

            @Override
            public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
                if (ex != null) {
                    logger.error("Error sending message: {}", ex.getMessage(), ex);
                    if (message != null) {
                        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                        if (accessor != null) {
                            logger.error("Failed message details - Command: {}, Destination: {}, Headers: {}",
                                accessor.getCommand(), accessor.getDestination(), accessor.toNativeHeaderMap());
                        }
                    }
                }
            }
        });

        // Configure message authorization (order is important: most specific to least specific)
        MessageMatcherDelegatingAuthorizationManager.Builder messages = MessageMatcherDelegatingAuthorizationManager.builder()
            .simpDestMatchers("/app/**").authenticated()
            .simpSubscribeDestMatchers("/user/queue/chat/**").authenticated() 
            .simpSubscribeDestMatchers("/user/queue/**").authenticated()    
            .simpSubscribeDestMatchers("/topic/user/**").authenticated()  
            .simpSubscribeDestMatchers("/user/**").authenticated()          
            .simpSubscribeDestMatchers("/queue/**").authenticated()         
            .simpSubscribeDestMatchers("/topic/chat/**").permitAll()     
            .anyMessage().permitAll(); 

        registration.interceptors(new AuthorizationChannelInterceptor(messages.build()));
    }
}
