package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.ScoringPolicyRequest;
import com.nguyenhoa.itam.asset.application.dto.ScoringPolicyResponse;
import com.nguyenhoa.itam.asset.domain.CategoryRepository;
import com.nguyenhoa.itam.asset.domain.ScoringPolicy;
import com.nguyenhoa.itam.asset.domain.ScoringPolicyRepository;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ScoringPolicyService {
    private final ScoringPolicyRepository repository;
    private final CategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public ScoringPolicyService(ScoringPolicyRepository repository, CategoryRepository categoryRepository, AuditLogService auditLogService) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ScoringPolicyResponse> getAllPolicies() {
        return repository.findAllByOrderByNameAsc().stream()
                .map(ScoringPolicyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScoringPolicyResponse getPolicyById(UUID id) {
        ScoringPolicy policy = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chính sách chấm điểm với ID: " + id));
        return ScoringPolicyResponse.fromEntity(policy);
    }

    public ScoringPolicyResponse createPolicy(ScoringPolicyRequest request, UUID userId) {
        validateWeights(request);
        if (repository.existsByName(request.getName())) {
            throw new BusinessException("DUPLICATE_POLICY_NAME", "Tên chính sách đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST);
        }

        ScoringPolicy policy = new ScoringPolicy();
        policy.setName(request.getName());
        policy.setDescription(request.getDescription());
        policy.setWeightAge(request.getWeightAge());
        policy.setWeightWarranty(request.getWeightWarranty());
        policy.setWeightIncident(request.getWeightIncident());
        policy.setWeightCondition(request.getWeightCondition());
        policy.setIsDefault(request.getIsDefault());

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            repository.findByIsDefaultTrue().ifPresent(existing -> {
                existing.setIsDefault(false);
                repository.save(existing);
            });
        }

        ScoringPolicy saved = repository.save(policy);

        auditLogService.log(userId, "CREATE", "POLICY", saved.getId(),
                Map.of("name", saved.getName(), "totalWeight", 100));

        return ScoringPolicyResponse.fromEntity(saved);
    }

    public ScoringPolicyResponse updatePolicy(UUID id, ScoringPolicyRequest request, UUID userId) {
        validateWeights(request);
        ScoringPolicy policy = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chính sách chấm điểm với ID: " + id));

        if (repository.existsByNameAndIdNot(request.getName(), id)) {
            throw new BusinessException("DUPLICATE_POLICY_NAME", "Tên chính sách đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST);
        }

        policy.setName(request.getName());
        policy.setDescription(request.getDescription());
        policy.setWeightAge(request.getWeightAge());
        policy.setWeightWarranty(request.getWeightWarranty());
        policy.setWeightIncident(request.getWeightIncident());
        policy.setWeightCondition(request.getWeightCondition());
        
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(policy.getIsDefault())) {
            repository.findByIsDefaultTrue().ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    existing.setIsDefault(false);
                    repository.save(existing);
                }
            });
            auditLogService.log(userId, "UPDATE", "POLICY", id, Map.of("isDefault", true));
        }
        policy.setIsDefault(request.getIsDefault());

        ScoringPolicy updated = repository.save(policy);
        return ScoringPolicyResponse.fromEntity(updated);
    }

    public void deletePolicy(UUID id) {
        ScoringPolicy policy = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chính sách chấm điểm với ID: " + id));

        if (categoryRepository.existsByScoringPolicyId(id)) {
            throw new BusinessException("POLICY_IN_USE", "Không thể xóa chính sách đang được áp dụng cho danh mục tài sản", HttpStatus.BAD_REQUEST);
        }

        repository.delete(policy);
    }

    private void validateWeights(ScoringPolicyRequest request) {
        int sum = (request.getWeightAge() != null ? request.getWeightAge() : 0) +
                  (request.getWeightWarranty() != null ? request.getWeightWarranty() : 0) +
                  (request.getWeightIncident() != null ? request.getWeightIncident() : 0) +
                  (request.getWeightCondition() != null ? request.getWeightCondition() : 0);
        if (sum != 100) {
            throw new BusinessException("INVALID_WEIGHTS", "Tổng trọng số các tiêu chí (Tuổi đời + Bảo hành + Sự cố + Tình trạng) phải bằng đúng 100% (Hiện tại: " + sum + "%)", HttpStatus.BAD_REQUEST);
        }
    }
}

