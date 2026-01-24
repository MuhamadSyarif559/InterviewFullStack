package com.example.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.CompanyDetail;


public interface CompanyRepository extends JpaRepository<CompanyDetail, Long>{

    Optional<CompanyDetail> findBycompanyName(String companyName); 
    
}
