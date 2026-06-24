package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.domain.RefreshToken;
import com.nguyenhoa.itam.iam.domain.RefreshTokenRepository;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(userRepository.findById(userId).orElseThrow(
                () -> new BusinessException("USER_NOT_FOUND", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND)
        ));

        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken verifyExpiration(RefreshToken refreshToken) {
        if(refreshToken.getIsRevoked() != null && refreshToken.getIsRevoked()) {
            throw new BusinessException("REFRESH_TOKEN_REVOKED", "Token này đã bị thu hồi hoặc đã được sử dụng", HttpStatus.UNAUTHORIZED);
        }

        if(refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("REFRESH_TOKEN_EXPIRED", "Token đã hết hạn. Vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED);
        }

        return refreshToken;
    }

    @Transactional
    public User verifyAndGetUser(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElseThrow(()
                        -> new BusinessException("REFRESH_TOKEN_NOT_FOUND", "Refresh token không tồn tại trong hệ thống", HttpStatus.NOT_FOUND)
        );

        verifyExpiration(refreshToken);
        return refreshToken.getUser();
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
