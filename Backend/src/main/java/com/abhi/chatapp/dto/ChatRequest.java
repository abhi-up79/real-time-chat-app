package com.abhi.chatapp.dto;

import java.util.List;

import lombok.Data;

@Data
public class ChatRequest {
    private String type;
    private String name;
    private List<String> userEmails;  // User emails instead of Auth0 IDs
}
