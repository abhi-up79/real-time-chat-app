package com.abhi.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.entity.ChatMember;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByUserId(String userId);
    List<ChatMember> findByChatId(Long chatId);
}
