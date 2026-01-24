package com.example.backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200") // simple CORS
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body("Email and password required");
        }

        if (userRepository.findByEmail(req.email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User u = new User();
        u.setEmail(req.email);
        u.setPassword(encoder.encode(req.password)); // HASH
        userRepository.save(u); // INSERT into users table

        return ResponseEntity.ok("Registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<User> existing = userRepository.findByEmail(req.email);
        if (existing.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        boolean ok = encoder.matches(req.password, existing.get().getPassword());
        if (!ok) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        return ResponseEntity.ok("Login success");
    }
}
