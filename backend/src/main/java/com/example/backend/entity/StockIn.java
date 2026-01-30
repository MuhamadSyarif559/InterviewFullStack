package com.example.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock_in")
public class StockIn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String runningNumber;

    @Column(nullable = true, length = 2000)
    private String description;

    @Column(name = "stock_date", nullable = false)
    private LocalDateTime date;

    @Column(nullable = true)
    private Long createdBy;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private boolean finalized = false;

    @OneToMany(mappedBy = "stockIn", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<StockInDetail> details = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRunningNumber() { return runningNumber; }
    public void setRunningNumber(String runningNumber) { this.runningNumber = runningNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public boolean isFinalized() { return finalized; }
    public void setFinalized(boolean finalized) { this.finalized = finalized; }

    public List<StockInDetail> getDetails() { return details; }
    public void setDetails(List<StockInDetail> details) { this.details = details; }
}
