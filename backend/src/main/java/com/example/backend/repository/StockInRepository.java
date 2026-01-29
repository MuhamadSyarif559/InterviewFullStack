package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.StockIn;

public interface StockInRepository extends JpaRepository<StockIn, Long> {
    List<StockIn> findByTenantId(Long tenantId);
    StockIn findFirstByTenantIdOrderByIdDesc(Long tenantId);
}
