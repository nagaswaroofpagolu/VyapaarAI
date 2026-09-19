package com.vyapaarai.controller;

import com.vyapaarai.dto.InventorySummaryResponse;
import com.vyapaarai.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/summary")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary() {
        InventorySummaryResponse summary = inventoryService.getSummary();
        return ResponseEntity.ok(summary);
    }
}
