package com.nguyenhoa.itam.asset.infrastructure.web;

import com.nguyenhoa.itam.asset.application.dto.ScoringPolicyRequest;
import com.nguyenhoa.itam.asset.application.dto.ScoringPolicyResponse;
import com.nguyenhoa.itam.asset.application.service.ScoringPolicyService;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/scoring-policies")
public class ScoringPolicyController {
    private final ScoringPolicyService service;

    public ScoringPolicyController(ScoringPolicyService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScoringPolicyResponse>>> getAllPolicies() {
        List<ScoringPolicyResponse> policies = service.getAllPolicies();
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScoringPolicyResponse>> getPolicyById(@PathVariable UUID id) {
        ScoringPolicyResponse policy = service.getPolicyById(id);
        return ResponseEntity.ok(ApiResponse.success(policy));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<ScoringPolicyResponse>> createPolicy(@Valid @RequestBody ScoringPolicyRequest request, @AuthenticationPrincipal UserPrincipal user) {
        ScoringPolicyResponse response = service.createPolicy(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<ScoringPolicyResponse>> updatePolicy(@PathVariable UUID id, @Valid @RequestBody ScoringPolicyRequest request, @AuthenticationPrincipal UserPrincipal user) {
        ScoringPolicyResponse response = service.updatePolicy(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<String>> deletePolicy(@PathVariable UUID id) {
        service.deletePolicy(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chính sách chấm điểm thành công"));
    }
}
