package com.vyapaarai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class ProductRequest {

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @NotBlank(message = "Category cannot be empty")
    private String category;

    @NotNull(message = "Quantity cannot be empty")
    @PositiveOrZero(message = "Quantity cannot be negative")
    private Double quantity;

    @NotBlank(message = "Unit cannot be empty")
    private String unit;

    @NotNull(message = "Selling price cannot be empty")
    @PositiveOrZero(message = "Selling price cannot be negative")
    private Double sellingPrice;

    @NotNull(message = "Cost price cannot be empty")
    @PositiveOrZero(message = "Cost price cannot be negative")
    private Double costPrice;

    @NotNull(message = "Low stock threshold cannot be empty")
    @PositiveOrZero(message = "Low stock threshold cannot be negative")
    private Double lowStockThreshold;

    public ProductRequest() {
    }

    public ProductRequest(String name, String category, Double quantity, String unit,
                          Double sellingPrice, Double costPrice, Double lowStockThreshold) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.sellingPrice = sellingPrice;
        this.costPrice = costPrice;
        this.lowStockThreshold = lowStockThreshold;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public Double getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(Double sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public Double getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(Double costPrice) {
        this.costPrice = costPrice;
    }

    public Double getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Double lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }
}
