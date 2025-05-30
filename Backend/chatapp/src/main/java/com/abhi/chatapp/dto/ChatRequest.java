package com.abhi.chatapp.dto;

import java.util.List;

import lombok.Data;

@Data
public class ChatRequest {
    private String type;
    private String name;
    private List<Long> userIds;
}
