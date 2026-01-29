package com.example.backend.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBytenantid(Long tenantid);
}