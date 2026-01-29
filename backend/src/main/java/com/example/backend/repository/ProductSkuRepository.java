package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.ProductSku;

public interface ProductSkuRepository extends JpaRepository<ProductSku, Long> {

    List<ProductSku> findByTenantID(Long tenantID);

    List<ProductSku> findByProduct_Id(Long productId);

    ProductSku findFirstBySkuCodeAndTenantID(String skuCode, Long tenantID);
}
