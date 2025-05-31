package com.abhi.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.abhi.chatapp.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
