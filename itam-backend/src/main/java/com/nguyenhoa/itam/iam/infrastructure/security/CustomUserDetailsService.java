package com.nguyenhoa.itam.iam.infrastructure.security;

import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.iam.domain.User;
import com.nguyenhoa.itam.iam.domain.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username).orElseThrow(() ->
                new UsernameNotFoundException("Không tìm thấy người dùng với username: " + username));
        return UserPrincipal.createUser(user);
    }
}
