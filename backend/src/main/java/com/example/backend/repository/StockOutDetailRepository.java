package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.StockOutDetail;

public interface StockOutDetailRepository extends JpaRepository<StockOutDetail, Long> {
    List<StockOutDetail> findByStockOut_Id(Long stockOutId);
}
