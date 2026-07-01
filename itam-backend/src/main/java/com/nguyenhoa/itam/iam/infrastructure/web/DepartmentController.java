package com.nguyenhoa.itam.iam.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.iam.domain.Department;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {
    private final UserService userService;

    public DepartmentController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments() {
        List<Department> departments = userService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.success(departments));
    }
}
