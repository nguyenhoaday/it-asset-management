package com.nguyenhoa.itam.license.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LicenseAllocationRepository extends JpaRepository<LicenseAllocation, UUID> {
    long countByLicenseIdAndReturnedAtIsNull(UUID licenseId);
    boolean existsByLicenseIdAndUserAndReturnedAtIsNull(UUID licenseId, UUID userId);
    Optional<LicenseAllocation> findByLicenseIdAndUserAndReturnedAtIsNull(UUID licenseId, UUID userId);
    @Query("SELECT la.license.id, COUNT(la) FROM LicenseAllocation la WHERE la.license.id IN :licenseIds AND la.returnedAt IS NULL GROUP BY la.license.id")
    List<Object[]> countActiveAllocationsByLicenseIds(@Param("licenseIds") List<UUID> licenseIds);

    @EntityGraph(attributePaths = {"license"})
    List<LicenseAllocation> findByLicenseIdOrderByAllocatedAtDesc(UUID licenseId);

    @EntityGraph(attributePaths = {"license"})
    List<LicenseAllocation> findByUserIdAndReturnedAtIsNullOrderByAllocatedAtDesc(UUID userId);
}
