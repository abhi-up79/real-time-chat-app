package com.abhi.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.model.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {

}
