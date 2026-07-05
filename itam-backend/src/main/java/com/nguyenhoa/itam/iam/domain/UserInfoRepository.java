package com.nguyenhoa.itam.iam.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserInfoRepository extends JpaRepository<UserInfo, UUID>, JpaSpecificationExecutor<UserInfo> {
    @EntityGraph(attributePaths = {"user", "department"})
    List<UserInfo> findTop5ByOrderByCareScoreDesc();
}
