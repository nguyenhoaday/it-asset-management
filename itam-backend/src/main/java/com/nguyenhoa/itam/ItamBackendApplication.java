package com.nguyenhoa.itam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ItamBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ItamBackendApplication.class, args);
	}

}
