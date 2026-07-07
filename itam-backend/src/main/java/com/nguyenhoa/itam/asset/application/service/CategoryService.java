package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.CategoryRequest;
import com.nguyenhoa.itam.asset.application.dto.CategoryResponse;
import com.nguyenhoa.itam.asset.application.dto.ScoringPolicyResponse;
import com.nguyenhoa.itam.asset.domain.AssetRepository;
import com.nguyenhoa.itam.asset.domain.Category;
import com.nguyenhoa.itam.asset.domain.CategoryRepository;
import com.nguyenhoa.itam.asset.domain.ScoringPolicy;
import com.nguyenhoa.itam.asset.domain.ScoringPolicyRepository;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final AssetRepository assetRepository;
    private final ScoringPolicyRepository scoringPolicyRepository;

    public CategoryService(CategoryRepository categoryRepository, AssetRepository assetRepository, ScoringPolicyRepository scoringPolicyRepository) {
        this.categoryRepository = categoryRepository;
        this.assetRepository = assetRepository;
        this.scoringPolicyRepository = scoringPolicyRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByCode(request.getCode())) {
            throw new BusinessException("CATEGORY_CODE_ALREADY_EXISTS",
                    "Mã danh mục đã tồn tại trong hệ thống", HttpStatus.CONFLICT);
        }

        Category category = new Category();
        category.setCode(request.getCode().toUpperCase().trim());
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setDefaultUsefulLifeMonths(request.getDefaultUsefulLifeMonths());
        category.setSpecificationSchema(request.getSpecificationSchema());
        category.setIsActive(request.getActive() != null ? request.getActive() : true);

        if (request.getScoringPolicyId() != null) {
            ScoringPolicy policy = scoringPolicyRepository.findById(request.getScoringPolicyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chính sách chấm điểm"));
            category.setScoringPolicy(policy);
        } else {
            category.setScoringPolicy(scoringPolicyRepository.findByIsDefaultTrue().orElse(null));
        }

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id).orElseThrow(() ->
                new BusinessException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục yêu cầu", HttpStatus.NOT_FOUND));

        // Validate: Nếu thay đổi mã code, phải kiểm tra xem mã mới đã bị danh mục khác sử dụng chưa
        String newCode = request.getCode().toUpperCase().trim();
        if (!category.getCode().equals(newCode)) {
            Optional<Category> optionalCategory = categoryRepository.findByCode(newCode);
            if (optionalCategory.isPresent() && !optionalCategory.get().getId().equals(id)) {
                throw new BusinessException("CATEGORY_CODE_ALREADY_EXISTS",
                        "Mã danh mục mới đã được sử dụng bởi danh mục khác", HttpStatus.CONFLICT);
            }
        }

        category.setCode(newCode);
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setDefaultUsefulLifeMonths(request.getDefaultUsefulLifeMonths());
        category.setSpecificationSchema(request.getSpecificationSchema());
        category.setIsActive(request.getActive() != null ? request.getActive() : true);

        if (request.getScoringPolicyId() != null) {
            ScoringPolicy policy = scoringPolicyRepository.findById(request.getScoringPolicyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chính sách chấm điểm"));
            category.setScoringPolicy(policy);
        } else {
            category.setScoringPolicy(null);
        }

        Category updatedCategory  = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id).orElseThrow(() ->
                new BusinessException("CATEGORY_NOT_FOUND",
                        "Không tìm thấy danh mục để xóa", HttpStatus.NOT_FOUND));

        if (assetRepository.existsByCategoryId(category.getId())) {
            throw new BusinessException("CATEGORY_HAS_ASSETS",
                    "Không thể xóa danh mục vì đang có tài sản liên kết", HttpStatus.BAD_REQUEST);
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse mapToResponse(Category category) {
        CategoryResponse res = new CategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getDefaultUsefulLifeMonths(),
                category.getSpecificationSchema(),
                category.getIsActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
        if (category.getScoringPolicy() != null) {
            res.setScoringPolicyId(category.getScoringPolicy().getId());
            res.setScoringPolicyName(category.getScoringPolicy().getName());
            res.setScoringPolicy(ScoringPolicyResponse.fromEntity(category.getScoringPolicy()));
        }
        return res;
    }
}
