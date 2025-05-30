package com.abhi.chatapp.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.abhi.chatapp.dto.ChatRequest;
import com.abhi.chatapp.dto.MessageRequest;
import com.abhi.chatapp.model.Chat;
import com.abhi.chatapp.model.ChatMember;
import com.abhi.chatapp.model.Message;
import com.abhi.chatapp.model.User;
import com.abhi.chatapp.repository.ChatMemberRepository;
import com.abhi.chatapp.repository.ChatRepository;
import com.abhi.chatapp.repository.MessageRepository;
import com.abhi.chatapp.repository.UserRepository;

@RestController
@RequestMapping("/api")
public class ChatController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PostMapping("/chats")
    public Chat createChat(@RequestBody ChatRequest request) {
        Chat chat = new Chat();
        chat.setType(request.getType());
        chat.setName(request.getName());
        Chat savedChat = chatRepository.save(chat);
        
        for (Long userId: request.getUserIds()) {
            ChatMember member = new ChatMember();
            member.setChat(savedChat);
            member.setUser(userRepository.findById(userId).orElseThrow());
            chatMemberRepository.save(member);
        }
        return savedChat;
    }

    @GetMapping("/users/{userId}/chats")
    public List<Chat> getUserChats(@PathVariable Long userId) {
        List<ChatMember> members = chatMemberRepository.findByUserId(userId);
        return members.stream().map(ChatMember::getChat).toList();
    }

    @GetMapping("/chats/{chatId}/messages")
    public List<Message> getChatMessages(@PathVariable Long chatId) {
        return messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }

    @MessageMapping("/chat/{chatId}")
    @SendTo("/topic/chat/{chatId}")
    public Message sendMessage(@DestinationVariable Long chatId, MessageRequest messageRequest) {
        Message message = new Message();
        message.setChat(chatRepository.findById(chatId).orElseThrow());
        message.setSender(userRepository.findById(messageRequest.getSenderId()).orElseThrow());
        message.setContent(messageRequest.getContent());
        message.setTimestamp(LocalDateTime.now());
        return messageRepository.save(message);
    }
}
