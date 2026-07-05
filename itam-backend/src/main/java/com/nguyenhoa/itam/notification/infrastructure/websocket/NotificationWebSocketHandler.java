package com.nguyenhoa.itam.notification.infrastructure.websocket;

import com.nguyenhoa.itam.iam.infrastructure.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(NotificationWebSocketHandler.class);
    
    private final JwtTokenProvider jwtTokenProvider;
    
    // Map kết nối session của từng user
    private final ConcurrentHashMap<String, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public NotificationWebSocketHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String email = extractEmailFromSession(session);
        if (email != null) {
            userSessions.computeIfAbsent(email, k -> new CopyOnWriteArrayList<>()).add(session);
            log.debug("WebSocket connection established for email: {}", email);
        } else {
            log.warn("WebSocket connection rejected: Invalid or missing token");
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String email = extractEmailFromSession(session);
        if (email != null) {
            List<WebSocketSession> sessions = userSessions.get(email);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(email);
                }
            }
            log.debug("WebSocket connection closed for email: {}", email);
        }
    }

    private String extractEmailFromSession(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String[] params = uri.getQuery().split("&");
            for (String param : params) {
                if (param.startsWith("token=")) {
                    String token = param.substring(6);
                    if (jwtTokenProvider.validateToken(token)) {
                        return jwtTokenProvider.getEmailFromToken(token);
                    }
                }
            }
        }
        return null;
    }

    public void sendMessageToUser(String email, String payload) {
        List<WebSocketSession> sessions = userSessions.get(email);
        if (sessions != null && !sessions.isEmpty()) {
            TextMessage message = new TextMessage(payload);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        log.error("Failed to send WebSocket message to email {}: {}", email, e.getMessage());
                    }
                }
            }
        }
    }
}
