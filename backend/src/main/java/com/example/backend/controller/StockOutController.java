package com.example.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.StockOutRequest;
import com.example.backend.entity.ProductSku;
import com.example.backend.entity.StockOut;
import com.example.backend.entity.StockOutDetail;
import com.example.backend.repository.ProductSkuRepository;
import com.example.backend.repository.StockOutDetailRepository;
import com.example.backend.repository.StockOutRepository;

@RestController
@RequestMapping("/api/stock-out")
public class StockOutController {

    @Autowired
    private StockOutRepository stockOutRepository;

    @Autowired
    private StockOutDetailRepository stockOutDetailRepository;

    @Autowired
    private ProductSkuRepository productSkuRepository;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<StockOut>> getByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(stockOutRepository.findBytenantId(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockOut> getById(@PathVariable Long id) {
        return stockOutRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StockOut> create(@RequestBody StockOutRequest request) {
        if (request.tenantId == null) {
            return ResponseEntity.badRequest().build();
        }
        StockOut stockOut = new StockOut();
        stockOut.setDescription(request.description);
        stockOut.setDate(request.date != null ? request.date : LocalDateTime.now());
        stockOut.setCreatedBy(request.createdBy);
        stockOut.setTenantId(request.tenantId);
        stockOut.setRunningNumber(nextRunningNumber(request.tenantId));
        stockOut.setFinalized(false);

        StockOut saved = stockOutRepository.save(stockOut);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        StockOut existing = stockOutRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (existing.isFinalized()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        stockOutRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockOut> update(@PathVariable Long id, @RequestBody StockOutRequest request) {
        StockOut existing = stockOutRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (existing.isFinalized()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        existing.setDescription(request.description);
        existing.setDate(request.date != null ? request.date : existing.getDate());
        existing.setCreatedBy(request.createdBy != null ? request.createdBy : existing.getCreatedBy());
        return ResponseEntity.ok(stockOutRepository.save(existing));
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<StockOut> finalizeStockOut(@PathVariable Long id) {
        StockOut existing = stockOutRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (existing.isFinalized()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        List<StockOutDetail> details = stockOutDetailRepository.findByStockOut_Id(id);
        for (StockOutDetail detail : details) {
            String skuCode = detail.getSku();
            if (skuCode == null || skuCode.isEmpty()) {
                continue;
            }
            ProductSku sku = productSkuRepository.findFirstBySkuCodeAndTenantID(skuCode, existing.getTenantId());
            if (sku == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            int available = sku.getQuantityAvailable();
            if (available < detail.getQuantity()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            sku.setQuantityAvailable(available - detail.getQuantity());
            productSkuRepository.save(sku);
        }

        existing.setFinalized(true);
        return ResponseEntity.ok(stockOutRepository.save(existing));
    }

    private String nextRunningNumber(Long tenantId) {
        StockOut last = stockOutRepository.findFirstBytenantIdOrderByIdDesc(tenantId);
        if (last == null || last.getRunningNumber() == null || last.getRunningNumber().isEmpty()) {
            return "SO001";
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
        return String.format("SO%03d", next);
    }

    @GetMapping("/next-number/tenant/{tenantId}")
    public ResponseEntity<String> getNextRunningNumber(@PathVariable Long tenantId) {
        return ResponseEntity.ok(nextRunningNumber(tenantId));
    }
}
