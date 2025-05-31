package com.abhi.chatapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.abhi.chatapp.entity.Message;
import com.abhi.chatapp.repository.MessageRepository;

@Service
public class MessageConsumer {

    @Autowired
    private MessageRepository messageRepository;

    @KafkaListener(topics = "message_persist", groupId ="chatapp")
    public void consume (Message message) {
        messageRepository.save(message);
    }
}
