package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.StockIn;

public interface StockInRepository extends JpaRepository<StockIn, Long> {
    List<StockIn> findBytenantId(Long tenantId);
    StockIn findFirstBytenantIdOrderByIdDesc(Long tenantId);
}
