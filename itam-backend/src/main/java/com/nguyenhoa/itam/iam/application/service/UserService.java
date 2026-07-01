package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.domain.Role;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import com.nguyenhoa.itam.iam.domain.Department;
import com.nguyenhoa.itam.iam.domain.DepartmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public UserService(UserRepository userRepository, DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
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

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getAllUsers(String search, Pageable pageable) {
        return userRepository.searchUserProfiles(search, pageable);
    }

    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> getDepartmentNamesMap() {
        return departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));
    }

    @Transactional(readOnly = true)
    public Map<UUID, UserProfileResponse> getUserProfilesMap(List<UUID> userIds) {
        return userRepository.findAllById(userIds).stream()
                .map(user -> userRepository.findUserProfileById(user.getId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toMap(UserProfileResponse::getId, u -> u));
    }
}
