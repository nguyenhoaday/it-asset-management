package com.nguyenhoa.itam.audit.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
        SELECT al FROM AuditLog al
        WHERE (:entityType IS NULL OR :entityType = '' OR al.entityType = :entityType)
        AND (:entityId IS NULL OR al.entityId = :entityId)
        AND (:action IS NULL OR :action = '' OR al.action = :action)
        ORDER BY al.createdAt DESC
    """)
    Page<AuditLog> searchAuditLogs(
            @Param("entityType") String entityType,
            @Param("entityId") UUID entityId,
            @Param("action") String action,
            Pageable pageable
    );
}
