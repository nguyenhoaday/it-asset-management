package com.nguyenhoa.itam.iam.infrastructure.bootstrap;

import com.nguyenhoa.itam.iam.domain.Role;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class AdminRecoveryRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminRecoveryRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.emergency-reset-password:#{null}}")
    private String emergencyPassword;

    public AdminRecoveryRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (emergencyPassword != null && !emergencyPassword.trim().isEmpty()) {
            List<User> superAdmins = userRepository.findByRoleIn(List.of(Role.SUPER_ADMIN));
            if (superAdmins.isEmpty()) {
                log.warn("Emergency reset triggered but no SUPER_ADMIN found.");
                return;
            }

            String encodedPassword = passwordEncoder.encode(emergencyPassword.trim());
            for (User admin : superAdmins) {
                admin.setPasswordHash(encodedPassword);
                userRepository.save(admin);
                log.info("Reset password for admin account: {}", admin.getUsername());
            }
            log.warn("Emergency reset completed. Remember to remove app.admin.emergency-reset-password config.");
        }
    }
}
