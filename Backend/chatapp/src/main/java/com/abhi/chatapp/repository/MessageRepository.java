package com.abhi.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.model.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatIdOrderByTimestampAsc(Long chatId);
}
