package com.vyapaarai.dto;

import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;

import java.util.List;

public class InventorySummaryResponse {

    private long totalProducts;
    private long totalLowStockProducts;
    private long totalOutOfStockProducts;
    private double totalStockValue;
    private List<Product> lowStockProducts;
    private List<InventoryTransaction> recentTransactions;

    public InventorySummaryResponse() {
    }

    public InventorySummaryResponse(long totalProducts, long totalLowStockProducts,
                                  long totalOutOfStockProducts, double totalStockValue,
                                  List<Product> lowStockProducts,
                                  List<InventoryTransaction> recentTransactions) {
        this.totalProducts = totalProducts;
        this.totalLowStockProducts = totalLowStockProducts;
        this.totalOutOfStockProducts = totalOutOfStockProducts;
        this.totalStockValue = totalStockValue;
        this.lowStockProducts = lowStockProducts;
        this.recentTransactions = recentTransactions;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalLowStockProducts() {
        return totalLowStockProducts;
    }

    public void setTotalLowStockProducts(long totalLowStockProducts) {
        this.totalLowStockProducts = totalLowStockProducts;
    }

    public long getTotalOutOfStockProducts() {
        return totalOutOfStockProducts;
    }

    public void setTotalOutOfStockProducts(long totalOutOfStockProducts) {
        this.totalOutOfStockProducts = totalOutOfStockProducts;
    }

    public double getTotalStockValue() {
        return totalStockValue;
    }

    public void setTotalStockValue(double totalStockValue) {
        this.totalStockValue = totalStockValue;
    }

    public List<Product> getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(List<Product> lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<InventoryTransaction> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<InventoryTransaction> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }
}
