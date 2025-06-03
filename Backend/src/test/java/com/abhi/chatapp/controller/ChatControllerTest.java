package com.abhi.chatapp.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.abhi.chatapp.entity.Chat;
import com.abhi.chatapp.entity.User;
import com.abhi.chatapp.repository.ChatMemberRepository;
import com.abhi.chatapp.repository.ChatRepository;
import com.abhi.chatapp.repository.MessageRepository;
import com.abhi.chatapp.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(ChatController.class)
@Import(ChatController.class)
public class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatMemberRepository chatMemberRepository;

    private User testUser;
    private Chat testChat;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("test-user-id");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");

        testChat = new Chat();
        testChat.setId(1L);
        testChat.setType("PRIVATE");
        testChat.setName("Test Chat");
    }

    @Test
    @WithMockUser
    void createOrUpdateUser_ShouldCreateNewUser() throws Exception {
        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUser.getId()))
                .andExpect(jsonPath("$.email").value(testUser.getEmail()));
    }

    @Test
    @WithMockUser
    void getUserChats_ShouldReturnChats() throws Exception {
        when(chatMemberRepository.findByUserId(any())).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/users/test-user-id/chats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser
    void getChatMessages_ShouldReturnMessages() throws Exception {
        when(messageRepository.findByChatIdOrderByTimestampAsc(any())).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/chats/1/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
} 