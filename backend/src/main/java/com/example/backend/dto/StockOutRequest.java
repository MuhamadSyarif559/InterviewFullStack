package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StockOutRequest {
    public String description;
    public LocalDateTime date;
    public Long createdBy;
    public Long tenantId;
    public List<StockOutDetailRequest> details;
}
