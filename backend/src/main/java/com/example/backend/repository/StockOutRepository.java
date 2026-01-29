package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.StockOut;

public interface StockOutRepository extends JpaRepository<StockOut, Long> {
    List<StockOut> findBytenantId(Long tenantId);
    StockOut findFirstBytenantIdOrderByIdDesc(Long tenantId);
}
