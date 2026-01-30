package com.example.backend.controller;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.StockLedgerEntry;
import com.example.backend.entity.StockIn;
import com.example.backend.entity.StockInDetail;
import com.example.backend.entity.StockOut;
import com.example.backend.entity.StockOutDetail;
import com.example.backend.entity.User;
import com.example.backend.repository.StockInRepository;
import com.example.backend.repository.StockOutRepository;
import com.example.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/stock-ledger")
public class StockLedgerController {

    private final StockInRepository stockInRepository;
    private final StockOutRepository stockOutRepository;
    private final UserRepository userRepository;

    public StockLedgerController(
        StockInRepository stockInRepository,
        StockOutRepository stockOutRepository,
        UserRepository userRepository
    ) {
        this.stockInRepository = stockInRepository;
        this.stockOutRepository = stockOutRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<StockLedgerEntry>> getLedgerByTenant(@PathVariable Long tenantId) {
        List<StockIn> stockIns = stockInRepository.findBytenantId(tenantId);
        List<StockOut> stockOuts = stockOutRepository.findBytenantId(tenantId);

        Set<Long> userIds = new HashSet<>();
        for (StockIn stockIn : stockIns) {
            if (stockIn.getCreatedBy() != null) {
                userIds.add(stockIn.getCreatedBy());
            }
        }
        for (StockOut stockOut : stockOuts) {
            if (stockOut.getCreatedBy() != null) {
                userIds.add(stockOut.getCreatedBy());
            }
        }

        Map<Long, String> userNames = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User user : userRepository.findAllById(userIds)) {
                userNames.put(user.getId(), user.getName());
            }
        }

        List<StockLedgerEntry> entries = new ArrayList<>();
        for (StockIn stockIn : stockIns) {
            String createdByName = userNames.get(stockIn.getCreatedBy());
            for (StockInDetail detail : stockIn.getDetails()) {
                entries.add(new StockLedgerEntry(
                    "IN",
                    stockIn.getId(),
                    stockIn.getRunningNumber(),
                    stockIn.getDate(),
                    detail.getProductName(),
                    detail.getSku(),
                    detail.getQuantity(),
                    stockIn.getCreatedBy(),
                    createdByName
                ));
            }
        }

        for (StockOut stockOut : stockOuts) {
            String createdByName = userNames.get(stockOut.getCreatedBy());
            for (StockOutDetail detail : stockOut.getDetails()) {
                entries.add(new StockLedgerEntry(
                    "OUT",
                    stockOut.getId(),
                    stockOut.getRunningNumber(),
                    stockOut.getDate(),
                    detail.getProductName(),
                    detail.getSku(),
                    detail.getQuantity(),
                    stockOut.getCreatedBy(),
                    createdByName
                ));
            }
        }

        entries.sort(Comparator
            .comparing(StockLedgerEntry::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .reversed());

        return ResponseEntity.ok(entries);
    }
}
