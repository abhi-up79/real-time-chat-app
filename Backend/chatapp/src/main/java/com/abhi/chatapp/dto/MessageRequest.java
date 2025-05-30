package com.abhi.chatapp.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private long senderId;
    private String content;
}
