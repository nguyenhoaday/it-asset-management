package com.nguyenhoa.itam.allocation.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AllocationRepository extends JpaRepository<Allocation, UUID> {
    List<Allocation> findByAssetOrderByEventTimeDesc(UUID assetId);
    Optional<Allocation> findFirstByAssetAndConfirmationStatusOrderByEventTimeDesc(UUID assetId, ConfirmationStatus confirmationStatus);
    Page<Allocation> findByConfirmationStatus(ConfirmationStatus confirmationStatus, Pageable pageable);
    List<Allocation> findByEventTimeBetweenOrderByEventTimeDesc(java.time.Instant from, java.time.Instant to);
}
