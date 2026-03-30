package com.interviewflow.authservice.service;

import com.interviewflow.authservice.security.AuthenticatedUser;
import com.interviewflow.authservice.security.JwtService;
import com.interviewflow.authservice.user.UserAccount;
import com.interviewflow.authservice.user.UserRepository;
import com.interviewflow.authservice.web.dto.AuthResponse;
import com.interviewflow.authservice.web.dto.CurrentUserResponse;
import com.interviewflow.authservice.web.dto.LoginRequest;
import com.interviewflow.authservice.web.dto.SignupRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered.");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setName(request.name().trim());
        userAccount.setEmail(normalizedEmail);
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));

        UserAccount savedUser = userRepository.save(userAccount);
        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount userAccount = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return buildAuthResponse(userAccount);
    }

    public CurrentUserResponse me(AuthenticatedUser authenticatedUser) {
        UserAccount userAccount = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        return new CurrentUserResponse(userAccount.getId(), userAccount.getName(), userAccount.getEmail());
    }

    private AuthResponse buildAuthResponse(UserAccount userAccount) {
        return new AuthResponse(
                jwtService.generateToken(userAccount),
                new CurrentUserResponse(userAccount.getId(), userAccount.getName(), userAccount.getEmail())
        );
    }
}
