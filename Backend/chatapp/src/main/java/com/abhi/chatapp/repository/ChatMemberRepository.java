package com.abhi.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.model.ChatMember;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByChatId(Long chatId);
    List<ChatMember> findByUserId(Long userId);
}
