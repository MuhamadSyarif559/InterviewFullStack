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

import com.example.backend.entity.StockIn;
import com.example.backend.entity.StockInDetail;
import com.example.backend.repository.StockInDetailRepository;
import com.example.backend.repository.StockInRepository;

@RestController
@RequestMapping("/api/stock-in-details")
public class StockInDetailController {

    @Autowired
    private StockInDetailRepository stockInDetailRepository;

    @Autowired
    private StockInRepository stockInRepository;

    @GetMapping("/stock-in/{stockInId}")
    public ResponseEntity<List<StockInDetail>> getByStockIn(@PathVariable Long stockInId) {
        return ResponseEntity.ok(stockInDetailRepository.findByStockIn_Id(stockInId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockInDetail> getById(@PathVariable Long id) {
        return stockInDetailRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/stock-in/{stockInId}")
    public ResponseEntity<StockInDetail> create(@PathVariable Long stockInId, @RequestBody StockInDetail detail) {
        StockIn stockIn = stockInRepository.findById(stockInId)
                .orElseThrow(() -> new RuntimeException("Stock in not found"));
        if (stockIn.isFinalized()) {
            return ResponseEntity.badRequest().build();
        }
        detail.setStockIn(stockIn);
        return ResponseEntity.ok(stockInDetailRepository.save(detail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockInDetail> update(@PathVariable Long id, @RequestBody StockInDetail updated) {
        StockInDetail detail = stockInDetailRepository.findById(id).orElse(null);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        if (detail.getStockIn() != null && detail.getStockIn().isFinalized()) {
            return ResponseEntity.badRequest().build();
        }
        detail.setProductName(updated.getProductName());
        detail.setSku(updated.getSku());
        detail.setQuantity(updated.getQuantity());
        return ResponseEntity.ok(stockInDetailRepository.save(detail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        StockInDetail detail = stockInDetailRepository.findById(id)
            .orElse(null);

        if (detail == null) {
            return ResponseEntity.notFound().build();
        }

        StockIn stockIn = detail.getStockIn();
        if (stockIn == null || stockIn.getTenantId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (stockIn.isFinalized()) {
            return ResponseEntity.badRequest().build();
        }

        stockInDetailRepository.delete(detail);
        return ResponseEntity.noContent().build();
    }
}
