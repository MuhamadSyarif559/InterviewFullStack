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

import com.example.backend.entity.Product;
import com.example.backend.entity.ProductSku;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ProductSkuRepository;

@RestController
@RequestMapping("/api/product-skus")
public class ProductSkuController {

    @Autowired
    private ProductSkuRepository productSkuRepository;

    @Autowired
    private ProductRepository productRepository;

    // Get SKUs by tenant
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ProductSku>> getByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(productSkuRepository.findByTenantID(tenantId));
    }

    // Get SKUs by product
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductSku>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productSkuRepository.findByProduct_Id(productId));
    }

    // Create SKU (linked to product)
    @PostMapping("/product/{productId}")
    public ResponseEntity<ProductSku> createSku(
            @PathVariable Long productId,
            @RequestBody ProductSku sku) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        sku.setProduct(product);
        return ResponseEntity.ok(productSkuRepository.save(sku));
    }

    // Update SKU
    @PutMapping("/{id}")
    public ResponseEntity<ProductSku> updateSku(
            @PathVariable Long id,
            @RequestBody ProductSku updated) {

        return productSkuRepository.findById(id).map(sku -> {
            sku.setSkuCode(updated.getSkuCode());
            sku.setColour(updated.getColour());
            sku.setSize(updated.getSize());
            sku.setQuantityAvailable(updated.getQuantityAvailable());
            sku.setImage(updated.getImage());
            return ResponseEntity.ok(productSkuRepository.save(sku));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete SKU
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSku(@PathVariable Long id) {
        productSkuRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
