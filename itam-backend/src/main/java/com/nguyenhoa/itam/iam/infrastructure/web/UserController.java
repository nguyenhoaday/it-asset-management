package com.nguyenhoa.itam.iam.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nguyenhoa.itam.common.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.nguyenhoa.itam.iam.application.dto.UpdateUserRequest;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse userProfileResponse = userService.getUserProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(userProfileResponse));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<UserProfileResponse>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserProfileResponse> usersPage = userService.getAllUsers(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(new PageResponse<>(usersPage)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserProfileResponse updated = userService.updateUser(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
