package com.tbx.finops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {
    org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration.class
})
public class FinopsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinopsApplication.class, args);
    }
}

