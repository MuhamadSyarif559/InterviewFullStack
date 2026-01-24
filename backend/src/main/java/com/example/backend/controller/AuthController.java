package com.example.backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.Session;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import jakarta.servlet.http.HttpSession;

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
        u.setPassword(encoder.encode(req.password)); 
        u.setName(req.name);
        u.setcompanyName(req.companyName);
        u.setEmployementStatus(req.EmploymentStatus);
        u.setIsDeleted(req.IsDeleted);


        userRepository.save(u); 

        return ResponseEntity.ok("Registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpSession session) {
        Optional<User> existing = userRepository.findByEmail(req.email);
        if (existing.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        boolean ok = encoder.matches(req.password, existing.get().getPassword());
        if (!ok) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        session.setAttribute("userId", existing.get().getId());
        session.setAttribute("email", existing.get().getEmail());
        session.setAttribute("name", existing.get().getName());
        session.setAttribute("companyName", existing.get().getcompanyName());
        return ResponseEntity.ok("Login success");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
    String email = (String) session.getAttribute("email");
    String name = (String) session.getAttribute("name");
    String companyName = (String) session.getAttribute("companyName");

    if (email == null) {
        return ResponseEntity.status(401).body("Not logged in");
    }

    Session response =new Session(email, name, companyName);

    return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out");
    }
}
