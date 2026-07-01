package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.application.dto.UpdateUserRequest;
import com.nguyenhoa.itam.iam.domain.Role;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import com.nguyenhoa.itam.iam.domain.Department;
import com.nguyenhoa.itam.iam.domain.DepartmentRepository;
import com.nguyenhoa.itam.iam.domain.UserInfo;
import com.nguyenhoa.itam.iam.domain.UserInfoRepository;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
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
    private final UserInfoRepository userInfoRepository;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, DepartmentRepository departmentRepository, UserInfoRepository userInfoRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.userInfoRepository = userInfoRepository;
        this.auditLogService = auditLogService;
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

    @Transactional
    public UserProfileResponse updateUser(UUID userId, UpdateUserRequest request, UUID adminId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new BusinessException("USER_NOT_FOUND", "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND)
        );

        UserInfo userInfo = userInfoRepository.findById(userId).orElseThrow(() ->
                new BusinessException("USER_INFO_NOT_FOUND", "Không tìm thấy thông tin chi tiết người dùng", HttpStatus.NOT_FOUND)
        );

        java.util.Map<String, Object> diff = new java.util.HashMap<>();

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty() 
                && !request.getFullName().trim().equals(userInfo.getFullName())) {
            diff.put("fullName", java.util.Map.of("old", userInfo.getFullName(), "new", request.getFullName().trim()));
            userInfo.setFullName(request.getFullName().trim());
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty() 
                && !request.getUsername().trim().equals(user.getUsername())) {
            String newUsername = request.getUsername().trim();
            if (userRepository.existsByUsername(newUsername)) {
                throw new BusinessException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại", HttpStatus.BAD_REQUEST);
            }
            diff.put("username", java.util.Map.of("old", user.getUsername(), "new", newUsername));
            user.setUsername(newUsername);
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() 
                && !request.getEmail().trim().equals(user.getEmail())) {
            String newEmail = request.getEmail().trim();
            if (userRepository.existsByEmail(newEmail)) {
                throw new BusinessException("EMAIL_ALREADY_EXISTS", "Email đã tồn tại", HttpStatus.BAD_REQUEST);
            }
            diff.put("email", java.util.Map.of("old", user.getEmail(), "new", newEmail));
            user.setEmail(newEmail);
        }

        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            Role newRole;
            try {
                newRole = Role.valueOf(request.getRole().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_ROLE", "Vai trò không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            if (user.getRole() != newRole) {
                diff.put("role", java.util.Map.of("old", user.getRole().name(), "new", newRole.name()));
                user.setRole(newRole);
            }
        }

        if (request.getDepartmentId() != null) {
            Department oldDept = userInfo.getDepartment();
            UUID oldDeptId = oldDept != null ? oldDept.getId() : null;
            if (!request.getDepartmentId().equals(oldDeptId)) {
                Department newDept = departmentRepository.findById(request.getDepartmentId()).orElseThrow(() ->
                        new BusinessException("DEPARTMENT_NOT_FOUND", "Không tìm thấy phòng ban", HttpStatus.NOT_FOUND)
                );
                diff.put("department", java.util.Map.of(
                        "old", oldDept != null ? oldDept.getName() : "",
                        "new", newDept.getName()
                ));
                userInfo.setDepartment(newDept);
            }
        }

        if (request.getIsActive() != null && !request.getIsActive().equals(user.getIsActive())) {
            diff.put("isActive", java.util.Map.of("old", user.getIsActive(), "new", request.getIsActive()));
            user.setIsActive(request.getIsActive());
        }

        if (!diff.isEmpty()) {
            userRepository.save(user);
            userInfoRepository.save(userInfo);
            auditLogService.log(adminId, "UPDATE", "USER", userId, diff);
        }

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                userInfo.getFullName(),
                user.getRole().name(),
                userInfo.getDepartment() != null ? userInfo.getDepartment().getName() : null,
                user.getIsActive()
        );
    }
}
