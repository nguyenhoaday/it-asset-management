package com.nguyenhoa.itam.license.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LicenseAllocationRepository extends JpaRepository<LicenseAllocation, UUID> {
    long countByLicenseIdAndReturnedAtIsNull(UUID licenseId);
    boolean existsByLicenseIdAndUserAndReturnedAtIsNull(UUID licenseId, UUID userId);
    Optional<LicenseAllocation> findByLicenseIdAndUserAndReturnedAtIsNull(UUID licenseId, UUID userId);
    List<LicenseAllocation> findByLicenseIdOrderByAllocatedAtDesc(UUID licenseId);
}
