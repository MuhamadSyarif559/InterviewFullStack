package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "product_skus")
public class ProductSku {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String skuCode;

    @Column(nullable = true)
    private String colour;

    @Column(nullable = true)
    private String size;

    @Column(nullable = false)
    private int quantityAvailable;

    @Column(nullable = true, length = 2000)
    private String image;

    @Column(nullable = false)
    private Long tenantID;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSkuCode() { return skuCode; }
    public void setSkuCode(String skuCode) { this.skuCode = skuCode; }

    public String getColour() { return colour; }
    public void setColour(String colour) { this.colour = colour; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public int getQuantityAvailable() { return quantityAvailable; }
    public void setQuantityAvailable(int quantityAvailable) { this.quantityAvailable = quantityAvailable; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public Long getTenantID() { return tenantID; }
    public void setTenantID(Long tenantID) { this.tenantID = tenantID; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    @JsonProperty("productId")
    public Long getProductId() {
        return product != null ? product.getId() : null;
    }
}
