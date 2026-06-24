package com.nguyenhoa.itam.asset.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssetCurrentHolderRepository extends JpaRepository<AssetCurrentHolder, UUID> {
    List<AssetCurrentHolder> findByUserId(UUID userId);
}
