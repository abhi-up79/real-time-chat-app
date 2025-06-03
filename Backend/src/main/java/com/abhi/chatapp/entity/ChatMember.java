package com.abhi.chatapp.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "chat_members")
@Data
public class ChatMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "chat_id")
    private Chat chat;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
