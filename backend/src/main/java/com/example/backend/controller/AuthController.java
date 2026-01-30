package com.example.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.CompanyRegisterRequest;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.Session;
import com.example.backend.entity.CompanyDetail;
import com.example.backend.entity.User;
import com.example.backend.repository.CompanyRepository;
import com.example.backend.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final CompanyRepository companyrepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository, CompanyRepository companyrepository) {
        this.userRepository = userRepository;
        this.companyrepository =companyrepository;
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
        u.setCompanyName(req.companyName);
        u.setEmploymentStatus(req.EmploymentStatus);
        u.setDeleted(req.IsDeleted);
        u.setTenantID(req.tenantID);

        userRepository.save(u); 

        return ResponseEntity.ok("Registered");
    }


    @PutMapping("/users/{id}")public ResponseEntity<?> updateUser(
        @PathVariable Long id,
        @RequestBody RegisterRequest req,
        HttpSession session
) {
    Long sessionUserId = (Long) session.getAttribute("userId");
    Integer employmentStatus = (Integer) session.getAttribute("employmentStatus");
    if (employmentStatus != null && employmentStatus == 1) {
        if (sessionUserId == null || !sessionUserId.equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not allowed");
        }
    }
    User u = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "User not found"));

    userRepository.findByEmail(req.email)
        .filter(existing -> !existing.getId().equals(id))
        .ifPresent(existing -> {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Email already exists");
        });

    u.setEmail(req.email);
    u.setName(req.name);
    u.setCompanyName(req.companyName);
    u.setEmploymentStatus(req.EmploymentStatus);
    u.setDeleted(req.IsDeleted);
    u.setTenantID(req.tenantID);

    if (req.password != null && !req.password.isBlank()) {
        u.setPassword(encoder.encode(req.password));
    }

    userRepository.save(u);

    return ResponseEntity.ok("User updated");
}


    @PostMapping("/Companyregister") public ResponseEntity<?> Companyregister(@RequestBody CompanyRegisterRequest req) {
        if (req.companyName == null || req.companyName.isBlank()) {
            return ResponseEntity.badRequest().body("Company name required");
        }

        CompanyDetail cr = new CompanyDetail();
        cr.setcompanyName(req.companyName);
        cr.setaddress("");
        cr.setPhoneNumbeString("");

        companyrepository.save(cr);

        return ResponseEntity.ok(cr.getId());
    }

    @PostMapping("/login") public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpSession session) {
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
        session.setAttribute("companyName", existing.get().getCompanyName());
        session.setAttribute("tenantID", existing.get().getTenantID());
        session.setAttribute("employmentStatus", existing.get().getEmploymentStatus());
        Session response = new Session(
            existing.get().getId(),
            existing.get().getEmail(),
            existing.get().getName(),
            existing.get().getCompanyName(),
            existing.get().getTenantID(),
            existing.get().getEmploymentStatus()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        String email = (String) session.getAttribute("email");
        if (email == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        String name = (String) session.getAttribute("name");
        String companyName = (String) session.getAttribute("companyName");
        Long tenantID = (Long) session.getAttribute("tenantID");
        Integer employmentStatus = (Integer) session.getAttribute("employmentStatus");

        Long userId = (Long) session.getAttribute("userId");
        Session response = new Session(
            userId != null ? userId : 0L,
            email,
            name,
            companyName,
            tenantID != null ? tenantID : 0L,
            employmentStatus != null ? employmentStatus : 0
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out");
    }

    @GetMapping("/employees")
    public ResponseEntity<?> getEmployeesByTenant(HttpSession session) {
        Long tenantID = (Long) session.getAttribute("tenantID");
        Long userId = (Long) session.getAttribute("userId");
        Integer employmentStatus = (Integer) session.getAttribute("employmentStatus");
        if (tenantID == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        if (employmentStatus != null && employmentStatus == 1) {
            if (userId == null) {
                return ResponseEntity.status(401).body("Not logged in");
            }
            return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(List.of(user)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(List.of()));
        }

        List<User> employees = userRepository.findBytenantID(tenantID);
        return ResponseEntity.ok(employees);
    }
}
