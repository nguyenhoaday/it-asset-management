package com.nguyenhoa.itam.common.application.service;

import com.nguyenhoa.itam.common.exception.BusinessException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads")
                .toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new BusinessException("COULD_NOT_CREATE_UPLOAD_DIR", 
                    "Không thể tạo thư mục lưu trữ tệp tin.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("EMPTY_FILE", "Tệp tin tải lên không được để trống.", HttpStatus.BAD_REQUEST);
        }

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFileName.contains("..")) {
            throw new BusinessException("INVALID_PATH_SEQUENCE", 
                    "Tên tệp tin chứa ký tự không hợp lệ: " + originalFileName, HttpStatus.BAD_REQUEST);
        }

        // unique name
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uniqueFileName;
        } catch (IOException ex) {
            throw new BusinessException("FILE_STORE_FAILED", 
                    "Không thể lưu tệp tin " + originalFileName + ". Vui lòng thử lại sau.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BusinessException("FILE_NOT_FOUND", "Không tìm thấy tệp tin: " + fileName, HttpStatus.NOT_FOUND);
            }
        } catch (MalformedURLException ex) {
            throw new BusinessException("FILE_NOT_FOUND", "Đường dẫn tệp tin không hợp lệ: " + fileName, HttpStatus.NOT_FOUND);
        }
    }
}
