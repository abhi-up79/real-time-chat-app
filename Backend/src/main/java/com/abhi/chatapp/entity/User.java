package com.abhi.chatapp.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @Column(length = 50)
    private String id;  // Auth0 user ID (sub claim)

    @Column(unique = true)
    private String email;

    private String name;
}
