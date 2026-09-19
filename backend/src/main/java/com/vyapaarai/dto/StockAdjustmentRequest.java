package com.vyapaarai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class StockAdjustmentRequest {

    @NotNull(message = "Quantity cannot be empty")
    @Positive(message = "Quantity must be greater than zero")
    private Double quantity;

    private String unit;

    private String reason;

    public StockAdjustmentRequest() {
    }

    public StockAdjustmentRequest(Double quantity, String unit, String reason) {
        this.quantity = quantity;
        this.unit = unit;
        this.reason = reason;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
