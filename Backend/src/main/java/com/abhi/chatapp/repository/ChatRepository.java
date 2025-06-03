package com.abhi.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {

}
