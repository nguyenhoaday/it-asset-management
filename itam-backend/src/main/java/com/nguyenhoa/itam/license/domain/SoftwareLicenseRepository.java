package com.nguyenhoa.itam.license.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface SoftwareLicenseRepository extends JpaRepository<SoftwareLicense, UUID>, JpaSpecificationExecutor<SoftwareLicense> {
    Optional<SoftwareLicense> findByIdAndIsActiveTrue(UUID id);
    boolean existsByLicenseCode(String licenseCode);
    boolean existsByLicenseCodeAndIdNot(String licenseCode, UUID id);

}
