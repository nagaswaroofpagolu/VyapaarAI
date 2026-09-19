package com.vyapaarai.config;

import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;
import com.vyapaarai.entity.TransactionType;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;

    public DataInitializer(ProductRepository productRepository,
                           InventoryTransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            log.info("Database is empty. Seeding initial demo inventory for 'Suresh Mart'...");

            List<Product> seedProducts = List.of(
                    // Name, Category, Quantity, Unit, SellingPrice, CostPrice, LowStockThreshold
                    new Product("Rice", "Grains", 25.0, "bags", 2500.0, 2200.0, 10.0),
                    new Product("Cooking Oil", "Oils", 12.0, "litres", 155.0, 130.0, 15.0),
                    new Product("Salt", "Spices & Seasoning", 25.0, "packets", 28.0, 20.0, 10.0),
                    new Product("Biscuits", "Snacks", 18.0, "cartons", 480.0, 400.0, 5.0),
                    new Product("Tea", "Beverages", 10.0, "boxes", 160.0, 120.0, 10.0),
                    new Product("Sugar", "Essentials", 30.0, "kg", 48.0, 42.0, 15.0),
                    new Product("Flour", "Grains", 15.0, "kg", 45.0, 35.0, 20.0),
                    new Product("Detergent", "Household", 8.0, "boxes", 260.0, 210.0, 10.0)
            );

            for (Product product : seedProducts) {
                Product saved = productRepository.save(product);
                InventoryTransaction initTx = new InventoryTransaction(
                        saved,
                        TransactionType.ADD,
                        saved.getQuantity(),
                        saved.getUnit(),
                        "Initial stock for Suresh Mart"
                );
                transactionRepository.save(initTx);
            }

            log.info("Successfully seeded {} products and initial transactions into MySQL.", seedProducts.size());
        } else {
            log.info("Existing database records found ({} products). Skipping seed.", productRepository.count());
        }
    }
}
