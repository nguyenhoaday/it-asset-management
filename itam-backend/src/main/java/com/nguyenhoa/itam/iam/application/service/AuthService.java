package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.dto.AuthResult;
import com.nguyenhoa.itam.iam.application.dto.LoginRequest;
import com.nguyenhoa.itam.iam.application.dto.RegisterRequest;
import com.nguyenhoa.itam.iam.domain.*;
import com.nguyenhoa.itam.iam.infrastructure.security.JwtTokenProvider;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserInfoRepository userInfoRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;


    public AuthService(UserRepository userRepository, UserInfoRepository userInfoRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.userInfoRepository = userInfoRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if(userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại trong hệ thống", HttpStatus.CONFLICT);
        }

        if(userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("EMAIL_ALREADY_EXISTS", "Địa chỉ email đã được đăng ký tài khoản khác", HttpStatus.CONFLICT);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Role userRole = Role.EMPLOYEE;
        if(request.getRole() != null) {
            try {
                userRole = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_ROLE", "Vai trò đăng ký không hợp lệ", HttpStatus.BAD_REQUEST);
            }
        }

        user.setRole(userRole);
        user.setIsActive(true);
        User savedUser = userRepository.save(user);

        UserInfo userInfo = new UserInfo();
        userInfo.setUser(savedUser);
        userInfo.setFullName(request.getFullName());

        if(request.getDepartmentId() != null) {
            Department department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new BusinessException("DEPARTMENT_NOT_FOUND", "Không tìm thấy phòng ban trong hệ thống", HttpStatus.NOT_FOUND));
            userInfo.setDepartment(department);
        }

        userInfoRepository.save(userInfo);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateToken(userPrincipal);

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userPrincipal.getId());
        return new AuthResult(accessToken, refreshToken.getToken());
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenService.deleteByUserId(userId);
    }

    @Transactional
    public AuthResult refreshAccessToken(String requestRefreshToken) {
        User user = refreshTokenService.verifyAndGetUser(requestRefreshToken);

        // Tạo UserPrincipal từ User để generateToken nhúng đúng userId + role vào claims
        UserPrincipal userPrincipal = UserPrincipal.createUser(user);
        String newAccessToken = jwtTokenProvider.generateToken(userPrincipal);

        return new AuthResult(newAccessToken, requestRefreshToken);
    }
}
