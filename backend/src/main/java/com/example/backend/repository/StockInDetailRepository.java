package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.StockInDetail;

public interface StockInDetailRepository extends JpaRepository<StockInDetail, Long> {
    List<StockInDetail> findByStockIn_Id(Long stockInId);
}
