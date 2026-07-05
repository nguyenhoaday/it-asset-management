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
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final UserInfoRepository userInfoRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, DepartmentRepository departmentRepository, UserInfoRepository userInfoRepository, AuditLogService auditLogService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.userInfoRepository = userInfoRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
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
    public Page<UserProfileResponse> getAllUsers(
            String search,
            UUID departmentId,
            Boolean isActive,
            Pageable pageable) {
        Specification<UserInfo> spec = (root, query, cb) -> {
            boolean isCountQuery = Long.class == query.getResultType() || long.class == query.getResultType();

            if (!isCountQuery) {
                root.fetch("user", JoinType.LEFT);
                root.fetch("department", JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("user").get("username")), like),
                    cb.like(cb.lower(root.get("user").get("email")), like),
                    cb.like(cb.lower(root.get("fullName")), like)
                ));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("user").get("isActive"), isActive));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userInfoRepository.findAll(spec, pageable).map(this::mapToProfileResponse);
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
        if (userIds == null || userIds.isEmpty()) return java.util.Collections.emptyMap();
        return userRepository.findUserProfilesByIds(userIds).stream()
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
            diff.put("fullName", createDiffMap(userInfo.getFullName(), request.getFullName().trim()));
            userInfo.setFullName(request.getFullName().trim());
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()
                && !request.getUsername().trim().equals(user.getUsername())) {
            String newUsername = request.getUsername().trim();
            if (userRepository.existsByUsername(newUsername)) {
                throw new BusinessException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại", HttpStatus.BAD_REQUEST);
            }
            diff.put("username", createDiffMap(user.getUsername(), newUsername));
            user.setUsername(newUsername);
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()
                && !request.getEmail().trim().equals(user.getEmail())) {
            String newEmail = request.getEmail().trim();
            if (userRepository.existsByEmail(newEmail)) {
                throw new BusinessException("EMAIL_ALREADY_EXISTS", "Email đã tồn tại", HttpStatus.BAD_REQUEST);
            }
            diff.put("email", createDiffMap(user.getEmail(), newEmail));
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
                diff.put("role", createDiffMap(user.getRole() != null ? user.getRole().name() : "", newRole.name()));
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
                diff.put("department", createDiffMap(
                        oldDept != null ? oldDept.getName() : "",
                        newDept.getName()
                ));
                userInfo.setDepartment(newDept);
            }
        }

        if (request.getIsActive() != null && !request.getIsActive().equals(user.getIsActive())) {
            diff.put("isActive", createDiffMap(user.getIsActive(), request.getIsActive()));
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
                user.getIsActive(),
                userInfo.getCareScore()
        );
    }

    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new BusinessException("USER_NOT_FOUND", "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND)
        );
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException("INVALID_OLD_PASSWORD", "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.log(userId, "UPDATE", "USER_PASSWORD", userId, java.util.Map.of("action", "change_password"));
    }

    @Transactional
    public String resetPasswordByAdmin(UUID userId, UUID adminId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new BusinessException("USER_NOT_FOUND", "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND)
        );

        int randomDigits = 1000 + (int)(Math.random() * 9000);
        String tempPassword = "Itam@" + randomDigits;

        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        auditLogService.log(adminId, "UPDATE", "USER_PASSWORD", userId, java.util.Map.of("action", "reset_password_by_admin"));

        return tempPassword;
    }

    @Transactional
    public void addCareScore(UUID userId, int points) {
        userInfoRepository.findById(userId).ifPresent(userInfo -> {
            int currentScore = userInfo.getCareScore() != null ? userInfo.getCareScore() : 100;
            int newScore = Math.max(0, Math.min(100, currentScore + points));
            userInfo.setCareScore(newScore);
            userInfoRepository.save(userInfo);
        });
    }

    @Transactional(readOnly = true)
    public java.util.List<UserProfileResponse> getLeaderboard() {
        return userInfoRepository.findTop5ByOrderByCareScoreDesc()
                .stream()
                .map(this::mapToProfileResponse)
                .toList();
    }

    private UserProfileResponse mapToProfileResponse(UserInfo userInfo) {
        return new UserProfileResponse(
                userInfo.getUser().getId(),
                userInfo.getUser().getUsername(),
                userInfo.getUser().getEmail(),
                userInfo.getFullName(),
                userInfo.getUser().getRole().name(),
                userInfo.getDepartment() != null ? userInfo.getDepartment().getName() : null,
                userInfo.getUser().getIsActive(),
                userInfo.getCareScore()
        );
    }
    private java.util.Map<String, String> createDiffMap(Object oldVal, Object newVal) {
        java.util.Map<String, String> map = new java.util.HashMap<>();
        map.put("old", oldVal != null ? oldVal.toString() : "");
        map.put("new", newVal != null ? newVal.toString() : "");
        return map;
    }
}
