package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.domain.Role;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(UUID userId) {
        return userRepository.findUserProfileById(userId)
                .orElseThrow(() -> new BusinessException(
                        "USER_NOT_FOUND", "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND
                ));
    }

    @Transactional(readOnly = true)
    public List<String> getITStaffEmail() {
        List<User> users = userRepository.findByRoleIn(List.of(Role.SUPER_ADMIN, Role.IT_STAFF));
        return users.stream().map(User::getEmail).collect(Collectors.toList());
    }
}
