package com.nguyenhoa.itam.asset.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScoringPolicyRepository extends JpaRepository<ScoringPolicy, UUID> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, UUID id);
    Optional<ScoringPolicy> findByIsDefaultTrue();
    List<ScoringPolicy> findAllByOrderByNameAsc();
}
