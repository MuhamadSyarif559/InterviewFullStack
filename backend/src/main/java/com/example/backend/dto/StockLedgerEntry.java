package com.example.backend.dto;

import java.time.LocalDateTime;

public class StockLedgerEntry {
    private final String type;
    private final Long recordId;
    private final String runningNumber;
    private final LocalDateTime date;
    private final String productName;
    private final String sku;
    private final int quantity;
    private final Long createdById;
    private final String createdByName;

    public StockLedgerEntry(
        String type,
        Long recordId,
        String runningNumber,
        LocalDateTime date,
        String productName,
        String sku,
        int quantity,
        Long createdById,
        String createdByName
    ) {
        this.type = type;
        this.recordId = recordId;
        this.runningNumber = runningNumber;
        this.date = date;
        this.productName = productName;
        this.sku = sku;
        this.quantity = quantity;
        this.createdById = createdById;
        this.createdByName = createdByName;
    }

    public String getType() {
        return type;
    }

    public Long getRecordId() {
        return recordId;
    }

    public String getRunningNumber() {
        return runningNumber;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public String getProductName() {
        return productName;
    }

    public String getSku() {
        return sku;
    }

    public int getQuantity() {
        return quantity;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }
}
