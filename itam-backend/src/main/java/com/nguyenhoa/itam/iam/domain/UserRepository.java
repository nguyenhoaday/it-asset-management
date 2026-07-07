package com.nguyenhoa.itam.iam.domain;

import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("""
        SELECT new com.nguyenhoa.itam.iam.application.dto.UserProfileResponse(
            u.id, u.username, u.email, ui.fullName,
            cast(u.role as string), d.name, u.isActive
        )
        FROM User u
        LEFT JOIN UserInfo ui ON ui.id = u.id
        LEFT JOIN ui.department d
        WHERE u.id = :userId
    """)
    Optional<UserProfileResponse> findUserProfileById(@Param("userId") UUID userId);

    @Query("""
        SELECT new com.nguyenhoa.itam.iam.application.dto.UserProfileResponse(
            u.id, u.username, u.email, ui.fullName,
            cast(u.role as string), d.name, u.isActive
        )
        FROM User u
        LEFT JOIN UserInfo ui ON ui.id = u.id
        LEFT JOIN ui.department d
        WHERE u.id IN :userIds
    """)
    List<UserProfileResponse> findUserProfilesByIds(@Param("userIds") List<UUID> userIds);

    List<User> findByRoleIn(List<Role> roles);
}
