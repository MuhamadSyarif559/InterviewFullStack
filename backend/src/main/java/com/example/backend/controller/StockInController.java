package com.example.backend.controller;

import java.time.LocalDateTime;
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

import com.example.backend.dto.StockInRequest;
import com.example.backend.entity.StockIn;
import com.example.backend.repository.StockInRepository;

@RestController
@RequestMapping("/api/stock-in")
public class StockInController {

    @Autowired
    private StockInRepository stockInRepository;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<StockIn>> getByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(stockInRepository.findByTenantId(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockIn> getById(@PathVariable Long id) {
        return stockInRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StockIn> create(@RequestBody StockInRequest request) {
        StockIn stockIn = new StockIn();
        stockIn.setDescription(request.description);
        stockIn.setDate(request.date != null ? request.date : LocalDateTime.now());
        stockIn.setCreatedBy(request.createdBy);
        Long tenantId = request.tenantId != null ? request.tenantId : 0L;
        stockIn.setTenantId(tenantId);
        stockIn.setRunningNumber(nextRunningNumber(tenantId));

        StockIn saved = stockInRepository.save(stockIn);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        stockInRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockIn> update(@PathVariable Long id, @RequestBody StockInRequest request) {
        return stockInRepository.findById(id).map(existing -> {
            existing.setDescription(request.description);
            existing.setDate(request.date != null ? request.date : existing.getDate());
            existing.setCreatedBy(request.createdBy != null ? request.createdBy : existing.getCreatedBy());
            return ResponseEntity.ok(stockInRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    private String nextRunningNumber(Long tenantId) {
        StockIn last = stockInRepository.findFirstByTenantIdOrderByIdDesc(tenantId);
        if (last == null || last.getRunningNumber() == null || last.getRunningNumber().isEmpty()) {
            return "SI001";
        }

        String raw = last.getRunningNumber().replaceAll("[^0-9]", "");
        int next = 1;
        if (!raw.isEmpty()) {
            try {
                next = Integer.parseInt(raw) + 1;
            } catch (NumberFormatException ex) {
                next = 1;
            }
        }
        return String.format("SI%03d", next);
    }

    @GetMapping("/next-number/tenant/{tenantId}")
    public ResponseEntity<String> getNextRunningNumber(@PathVariable Long tenantId) {
        return ResponseEntity.ok(nextRunningNumber(tenantId));
    }
}
