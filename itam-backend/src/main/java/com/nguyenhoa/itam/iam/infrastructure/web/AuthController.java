package com.nguyenhoa.itam.iam.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.dto.*;
import com.nguyenhoa.itam.iam.application.service.AuthService;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>>register(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>>login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResult result = authService.login(loginRequest);

        ResponseCookie cookie = buildRefreshCookie(result.getRefreshToken());

        AuthResponse response = new AuthResponse(result.getAccessToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>>logout(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            authService.logout(userPrincipal.getId());
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Đổi thành true trên production
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Đăng xuất thành công"));
    }

    @PostMapping("/refresh")
    public  ResponseEntity<ApiResponse<AuthResponse>>refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException("MISSING_REFRESH_TOKEN", "Không tìm thấy phiên làm việc", HttpStatus.BAD_REQUEST);
        }

        AuthResult result = authService.refreshAccessToken(refreshToken);
        ResponseCookie cookie = buildRefreshCookie(result.getRefreshToken());

        AuthResponse response = new AuthResponse(result.getAccessToken());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Đổi thành true trên production
                .path("/")
                .sameSite("Lax")
                .build();
    }
}
