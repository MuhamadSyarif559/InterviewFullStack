package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StockInRequest {
    public String description;
    public LocalDateTime date;
    public Long createdBy;
    public Long tenantId;
    public List<StockInDetailRequest> details;
}
