package com.abhi.chatapp.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private String senderId;  // Auth0 user ID
    private String content;
}
