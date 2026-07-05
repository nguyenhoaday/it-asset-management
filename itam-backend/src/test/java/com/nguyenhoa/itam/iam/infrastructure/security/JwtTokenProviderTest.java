package com.nguyenhoa.itam.iam.infrastructure.security;

import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.iam.domain.Role;
import com.nguyenhoa.itam.iam.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private UserPrincipal userPrincipal;
    private final String secretKey = "c3VwZXItc2VjcmV0LWtleS1mb3ItZGV2ZWxvcG1lbnQtYXRfbGVhc3QtNjQtY2hhcmFjdGVycy1sb25n";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", secretKey);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 900000L); // 15 phút
        jwtTokenProvider.init();

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("admin");
        user.setEmail("admin@itam.com");
        user.setPasswordHash("hashedpassword");
        user.setRole(Role.SUPER_ADMIN);

        userPrincipal = UserPrincipal.createUser(user);
    }

    @Test
    @DisplayName("Tạo JWT Token và xác thực claims thành công")
    void testGenerateTokenAndValidate() {
        String token = jwtTokenProvider.generateToken(userPrincipal);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token), "Token phải hợp lệ");
        assertEquals("admin@itam.com", jwtTokenProvider.getEmailFromToken(token));
        assertEquals("ROLE_SUPER_ADMIN", jwtTokenProvider.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Xác thực token không hợp lệ trả về false")
    void testValidateToken_InvalidToken_ReturnsFalse() {
        String invalidToken = "invalid.jwt.token";

        assertFalse(jwtTokenProvider.validateToken(invalidToken), "Token rác phải trả về false");
    }
}
