package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock_out_details")
public class StockOutDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = true)
    private String sku;

    @Column(nullable = false)
    private int quantity;

    @ManyToOne
    @JoinColumn(name = "stock_out_id", nullable = false)
    @JsonBackReference
    private StockOut stockOut;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public StockOut getStockOut() { return stockOut; }
    public void setStockOut(StockOut stockOut) { this.stockOut = stockOut; }

    @JsonProperty("stockOutId")
    public Long getStockOutId() {
        return stockOut != null ? stockOut.getId() : null;
    }
}
