package com.abhi.chatapp.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.abhi.chatapp.dto.ChatRequest;
import com.abhi.chatapp.dto.MessageRequest;
import com.abhi.chatapp.entity.Chat;
import com.abhi.chatapp.entity.ChatMember;
import com.abhi.chatapp.entity.Message;
import com.abhi.chatapp.entity.User;
import com.abhi.chatapp.repository.ChatMemberRepository;
import com.abhi.chatapp.repository.ChatRepository;
import com.abhi.chatapp.repository.MessageRepository;
import com.abhi.chatapp.repository.UserRepository;

@RestController
@RequestMapping("/api")
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ChatMemberRepository chatMemberRepository;
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
    @Autowired
    private KafkaTemplate<String, Message> kafkaTemplate;

    @PostMapping("/users")
    public ResponseEntity<?> createOrUpdateUser(@AuthenticationPrincipal Jwt jwt, @RequestBody User userRequest) {
        try {
            String userId = jwt.getSubject();
            
            logger.debug("Processing user creation/update request for user ID: {}", userId);
            logger.debug("User details - Email: {}, Name: {}", userRequest.getEmail(), userRequest.getName());

            if (userRequest.getEmail() == null) {
                logger.warn("User creation/update failed: Email is required");
                return ResponseEntity.badRequest()
                    .body("Email is required");
            }

            User user = userRepository.findById(userId).orElse(new User());
            logger.debug("Existing user found: {}", user.getId() != null);
            
            // Only update if there are changes
            boolean needsUpdate = false;
            if (userRequest.getEmail() != null && !userRequest.getEmail().equals(user.getEmail())) {
                logger.info("Updating user email from: {} to: {}", user.getEmail(), userRequest.getEmail());
                user.setEmail(userRequest.getEmail());
                needsUpdate = true;
            }
            if ((userRequest.getName() != null && !userRequest.getName().equals(user.getName())) || 
                (userRequest.getName() == null && user.getName() != null)) {
                logger.info("Updating user name from: {} to: {}", user.getName(), userRequest.getName());
                user.setName(userRequest.getName());
                needsUpdate = true;
            }
            
            // Only save if it's a new user or there are changes
            if (user.getId() == null || needsUpdate) {
                user.setId(userId);
                user = userRepository.save(user);
                logger.info("User saved successfully with ID: {}", user.getId());
            } else {
                logger.debug("No changes needed, skipping save");
            }
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error in createOrUpdateUser: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body("Failed to create/update user: " + e.getMessage());
        }
    }

    @PostMapping("/chats")
    public ResponseEntity<?> createChat(@RequestBody ChatRequest request, @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt.getSubject();
            logger.debug("Creating new chat for user ID: {}", userId);
            
            if (userId == null) {
                logger.warn("Chat creation failed: User ID not found in token");
                return ResponseEntity.badRequest()
                    .body("User ID not found in token");
            }

            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                logger.warn("Chat creation failed: Current user not found for ID: {}", userId);
                return ResponseEntity.badRequest()
                    .body("Current user not found. Please ensure you are registered.");
            }

            // Create chat
            Chat chat = new Chat();
            chat.setType(request.getType());
            chat.setName(request.getName());
            Chat savedChat = chatRepository.save(chat);
            logger.info("Created new chat with ID: {}, type: {}, name: {}", 
                savedChat.getId(), savedChat.getType(), savedChat.getName());
            
            // Add current user to chat
            ChatMember currentMember = new ChatMember();
            currentMember.setChat(savedChat);
            currentMember.setUser(currentUser);
            chatMemberRepository.save(currentMember);
            logger.debug("Added current user {} to chat {}", userId, savedChat.getId());
            
            // Add other users and notify them
            if (request.getUserEmails() != null) {
                for (String email : request.getUserEmails()) {
                    User user = userRepository.findByEmail(email);
                    if (user == null) {
                        logger.warn("Skipping non-existent user with email: {}", email);
                        continue;
                    }
                    ChatMember member = new ChatMember();
                    member.setChat(savedChat);
                    member.setUser(user);
                    chatMemberRepository.save(member);
                    logger.debug("Added user {} to chat {}", user.getId(), savedChat.getId());

                    // Notify the user about the new chat
                    simpMessagingTemplate.convertAndSend("/topic/user/" + user.getId() + "/chats", savedChat);
                    logger.debug("Sent chat notification to user: {}", user.getId());
                }
            }

            // Notify the current user about the new chat
            simpMessagingTemplate.convertAndSend("/topic/user/" + userId + "/chats", savedChat);
            logger.debug("Sent chat notification to current user: {}", userId);
            
            return ResponseEntity.ok(savedChat);
        } catch (Exception e) {
            logger.error("Error in createChat: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body("Failed to create chat: " + e.getMessage());
        }
    }

    @GetMapping("/users/{userId}/chats")
    public ResponseEntity<?> getUserChats(@PathVariable String userId) {
        try {
            logger.debug("Fetching chats for user: {}", userId);
            List<ChatMember> members = chatMemberRepository.findByUserId(userId);
            logger.debug("Found {} chats for user {}", members.size(), userId);
            return ResponseEntity.ok(members.stream().map(ChatMember::getChat).toList());
        } catch (Exception e) {
            logger.error("Error fetching chats for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body("Failed to get user chats: " + e.getMessage());
        }
    }

    @GetMapping("/chats/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(@PathVariable Long chatId) {
        try {
            logger.debug("Fetching messages for chat: {}", chatId);
            List<Message> messages = messageRepository.findByChatIdOrderByTimestampAsc(chatId);
            logger.debug("Found {} messages for chat {}", messages.size(), chatId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            logger.error("Error fetching messages for chat {}: {}", chatId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body("Failed to get chat messages: " + e.getMessage());
        }
    }

    @MessageMapping("/chat/{chatId}")
    public void sendMessage(@DestinationVariable Long chatId, MessageRequest messageRequest) {
        logger.debug("Received WebSocket message for chatId: {}, senderId: {}", 
            chatId, messageRequest.getSenderId());
        
        try {
            Message message = new Message();
            message.setChat(chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found")));
            message.setSender(userRepository.findById(messageRequest.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found")));
            message.setContent(messageRequest.getContent());
            message.setTimestamp(LocalDateTime.now());

            kafkaTemplate.send("message_persist", message);
            logger.debug("Message sent to Kafka for persistence");
            
            simpMessagingTemplate.convertAndSend("/topic/chat/" + chatId, message);
            logger.debug("Message broadcast to chat {}: {}", chatId, message.getContent());
        } catch (Exception e) {
            logger.error("Error sending message to chat {}: {}", chatId, e.getMessage(), e);
            simpMessagingTemplate.convertAndSend("/topic/chat/" + chatId + "/error", 
                "Failed to send message: " + e.getMessage());
        }
    }
}
