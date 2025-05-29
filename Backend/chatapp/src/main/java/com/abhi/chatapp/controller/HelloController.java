package com.abhi.chatapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chatapp/v1")
public class HelloController {

    @RequestMapping("/")
    public String hello() {
        return "Hello World from Abhi!";
    }
}
