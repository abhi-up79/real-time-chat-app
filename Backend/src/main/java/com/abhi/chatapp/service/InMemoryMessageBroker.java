package com.abhi.chatapp.service;

import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import com.abhi.chatapp.entity.Message;
import com.abhi.chatapp.repository.MessageRepository;
import com.abhi.chatapp.repository.ChatMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class InMemoryMessageBroker {
    private static final Logger logger = LoggerFactory.getLogger(InMemoryMessageBroker.class);

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void handleMessage(Message message) {
        try {
            // Save message to database
            message = messageRepository.save(message);
            logger.debug("Message saved to database: {}", message.getId());

            // Get all chat members
            var chatMembers = chatMemberRepository.findByChatId(message.getChat().getId());
            logger.debug("Found {} members in chat {}", chatMembers.size(), message.getChat().getId());

            // Broadcast message to all chat members
            for (var member : chatMembers) {
                String userId = member.getUser().getId();
                // Send to user's personal queue for real-time updates
                messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/chat/" + message.getChat().getId(),
                    message
                );
                logger.debug("Message sent to user's queue: userId={}, chatId={}", 
                    userId, message.getChat().getId());
            }

            // Also broadcast to the chat topic for general subscribers
            messagingTemplate.convertAndSend("/topic/chat/" + message.getChat().getId(), message);
            logger.debug("Message broadcast to chat topic: chatId={}", message.getChat().getId());
        } catch (Exception e) {
            logger.error("Error handling message: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend("/topic/chat/" + message.getChat().getId() + "/error", 
                "Failed to process message: " + e.getMessage());
        }
    }
} 