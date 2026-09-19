package com.vyapaarai.service;

import com.vyapaarai.dto.InventorySummaryResponse;
import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryService(ProductRepository productRepository,
                            InventoryTransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getSummary() {
        List<Product> allProducts = productRepository.findAll();
        long totalProducts = allProducts.size();

        long lowStockCount = 0;
        long outOfStockCount = 0;
        double totalStockValue = 0.0;
        List<Product> lowStockProducts = new ArrayList<>();

        for (Product p : allProducts) {
            double qty = p.getQuantity() != null ? p.getQuantity() : 0.0;
            double threshold = p.getLowStockThreshold() != null ? p.getLowStockThreshold() : 0.0;
            double price = p.getSellingPrice() != null ? p.getSellingPrice() : 0.0;

            totalStockValue += (qty * price);

            if (qty <= 0.0) {
                outOfStockCount++;
                lowStockProducts.add(p);
            } else if (qty <= threshold) {
                lowStockCount++;
                lowStockProducts.add(p);
            }
        }

        List<InventoryTransaction> recentTransactions = transactionRepository.findTop15ByOrderByCreatedAtDesc();

        return new InventorySummaryResponse(
                totalProducts,
                lowStockCount,
                outOfStockCount,
                totalStockValue,
                lowStockProducts,
                recentTransactions
        );
    }
}
