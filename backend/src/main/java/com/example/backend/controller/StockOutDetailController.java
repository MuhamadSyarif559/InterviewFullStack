package com.example.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.StockOut;
import com.example.backend.entity.StockOutDetail;
import com.example.backend.repository.StockOutDetailRepository;
import com.example.backend.repository.StockOutRepository;

@RestController
@RequestMapping("/api/stock-out-details")
public class StockOutDetailController {

    @Autowired
    private StockOutDetailRepository stockOutDetailRepository;

    @Autowired
    private StockOutRepository stockOutRepository;

    @GetMapping("/stock-out/{stockOutId}")
    public ResponseEntity<List<StockOutDetail>> getByStockOut(@PathVariable Long stockOutId) {
        return ResponseEntity.ok(stockOutDetailRepository.findByStockOut_Id(stockOutId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockOutDetail> getById(@PathVariable Long id) {
        return stockOutDetailRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/stock-out/{stockOutId}")
    public ResponseEntity<StockOutDetail> create(@PathVariable Long stockOutId, @RequestBody StockOutDetail detail) {
        StockOut stockOut = stockOutRepository.findById(stockOutId)
                .orElseThrow(() -> new RuntimeException("Stock out not found"));
        if (stockOut.isFinalized()) {
            return ResponseEntity.badRequest().build();
        }
        detail.setStockOut(stockOut);
        return ResponseEntity.ok(stockOutDetailRepository.save(detail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockOutDetail> update(@PathVariable Long id, @RequestBody StockOutDetail updated) {
        StockOutDetail detail = stockOutDetailRepository.findById(id).orElse(null);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        if (detail.getStockOut() != null && detail.getStockOut().isFinalized()) {
            return ResponseEntity.badRequest().build();
        }
        detail.setProductName(updated.getProductName());
        detail.setSku(updated.getSku());
        detail.setQuantity(updated.getQuantity());
        return ResponseEntity.ok(stockOutDetailRepository.save(detail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        StockOutDetail detail = stockOutDetailRepository.findById(id)
            .orElse(null);

        if (detail == null) {
            return ResponseEntity.notFound().build();
        }

        StockOut stockOut = detail.getStockOut();
        if (stockOut == null || stockOut.getTenantId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (stockOut.isFinalized()) {
            return ResponseEntity.badRequest().build();
        }

        stockOutDetailRepository.delete(detail);
        return ResponseEntity.noContent().build();
    }
}
