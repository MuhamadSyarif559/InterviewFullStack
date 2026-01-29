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

import com.example.backend.entity.ProductSku;
import com.example.backend.entity.StockIn;
import com.example.backend.entity.StockInDetail;
import com.example.backend.repository.ProductSkuRepository;
import com.example.backend.repository.StockInDetailRepository;
import com.example.backend.repository.StockInRepository;

@RestController
@RequestMapping("/api/stock-in-details")
public class StockInDetailController {

    @Autowired
    private StockInDetailRepository stockInDetailRepository;

    @Autowired
    private StockInRepository stockInRepository;

    @Autowired
    private ProductSkuRepository productSkuRepository;

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
        detail.setStockIn(stockIn);
        StockInDetail saved = stockInDetailRepository.save(detail);
        adjustSkuQuantity(stockIn.getTenantId(), saved.getSku(), saved.getQuantity());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockInDetail> update(@PathVariable Long id, @RequestBody StockInDetail updated) {
        return stockInDetailRepository.findById(id).map(detail -> {
            String oldSku = detail.getSku();
            int oldQty = detail.getQuantity();
            detail.setProductName(updated.getProductName());
            detail.setSku(updated.getSku());
            detail.setQuantity(updated.getQuantity());
            StockInDetail saved = stockInDetailRepository.save(detail);

            Long tenantId = detail.getStockIn() != null ? detail.getStockIn().getTenantId() : 0L;
            if (oldSku != null && !oldSku.isEmpty()) {
                adjustSkuQuantity(tenantId, oldSku, -oldQty);
            }
            if (saved.getSku() != null && !saved.getSku().isEmpty()) {
                adjustSkuQuantity(tenantId, saved.getSku(), saved.getQuantity());
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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

        Long tenantId = stockIn.getTenantId();
        String skuCode = detail.getSku();
        int qty = detail.getQuantity();

        // 🔹 Adjust SKU quantity only if SKU exists
        if (skuCode != null && !skuCode.isBlank()) {
            ProductSku sku = productSkuRepository
                .findFirstBySkuCodeAndTenantID(skuCode, tenantId);

            if (sku != null) {
                sku.setQuantityAvailable(
                    sku.getQuantityAvailable() - qty
                );
                productSkuRepository.save(sku);
            }
            // else: SKU missing → ignore adjustment (do NOT crash delete)
        }

        stockInDetailRepository.delete(detail);

        return ResponseEntity.noContent().build();
    }

    private void adjustSkuQuantity(Long tenantId, String skuCode, int delta) {
        if (tenantId == null || skuCode == null || skuCode.isBlank()) {
            return;
        }

        ProductSku sku =
            productSkuRepository.findFirstBySkuCodeAndTenantID(skuCode, tenantId);

        if (sku == null) {
            return; // silently skip
        }

        sku.setQuantityAvailable(
            sku.getQuantityAvailable() + delta
        );

        productSkuRepository.save(sku);
    }

}
