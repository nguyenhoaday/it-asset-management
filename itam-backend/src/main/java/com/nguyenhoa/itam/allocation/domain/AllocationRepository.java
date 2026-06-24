package com.nguyenhoa.itam.allocation.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AllocationRepository extends JpaRepository<Allocation, UUID> {
    List<Allocation> findByAssetOrderByEventTimeDesc(UUID assetId);
    Optional<Allocation> findFirstByAssetAndConfirmationStatusOrderByEventTimeDesc(UUID assetId, ConfirmationStatus confirmationStatus);
}
