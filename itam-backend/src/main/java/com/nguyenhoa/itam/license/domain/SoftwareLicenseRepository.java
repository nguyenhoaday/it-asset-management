package com.nguyenhoa.itam.license.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SoftwareLicenseRepository extends JpaRepository<SoftwareLicense, UUID> {
    Optional<SoftwareLicense> findByIdAndIsActiveTrue(UUID id);
    boolean existsByLicenseCode(String licenseCode);
    boolean existsByLicenseCodeAndIdNot(String licenseCode, UUID id);

    @Query("""
        SELECT sl FROM SoftwareLicense sl
        WHERE sl.isActive = true
        AND (CAST(:search AS string) IS NULL OR LOWER(sl.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
            OR LOWER(sl.licenseCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
    """)
    Page<SoftwareLicense> searchLicense(@Param("search") String search, Pageable pageable);
}
