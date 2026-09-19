package com.vyapaarai.service;

import com.vyapaarai.dto.ProductRequest;
import com.vyapaarai.dto.StockAdjustmentRequest;
import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;
import com.vyapaarai.entity.TradeUnit;
import com.vyapaarai.entity.TransactionType;
import com.vyapaarai.exception.InsufficientStockException;
import com.vyapaarai.exception.ResourceNotFoundException;
import com.vyapaarai.exception.ValidationException;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;

    public ProductService(ProductRepository productRepository,
                          InventoryTransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    private void validateUnit(String unit) {
        if (!TradeUnit.isValid(unit)) {
            throw new ValidationException(
                    "Invalid unit '" + unit + "'. Supported units: " +
                    String.join(", ", TradeUnit.getValidUnits())
            );
        }
    }

    private String resolveAdjustmentUnit(Product product, String requestedUnit) {
        String unit = (requestedUnit != null && !requestedUnit.trim().isEmpty())
                ? TradeUnit.normalize(requestedUnit)
                : product.getUnit();
        validateUnit(unit);
        if (!unit.equals(product.getUnit())) {
            throw new ValidationException(
                    "Stock adjustment unit must match the product unit: " + product.getUnit()
            );
        }
        return product.getUnit();
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        validateUnit(request.getUnit());

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("Product name cannot be empty");
        }
        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new ValidationException("Quantity cannot be negative");
        }
        if (request.getSellingPrice() != null && request.getSellingPrice() < 0) {
            throw new ValidationException("Selling price cannot be negative");
        }
        if (request.getCostPrice() != null && request.getCostPrice() < 0) {
            throw new ValidationException("Cost price cannot be negative");
        }
        if (request.getLowStockThreshold() != null && request.getLowStockThreshold() < 0) {
            throw new ValidationException("Low stock threshold cannot be negative");
        }

        Product product = new Product(
                request.getName().trim(),
                request.getCategory().trim(),
                request.getQuantity(),
                request.getUnit(),
                request.getSellingPrice(),
                request.getCostPrice(),
                request.getLowStockThreshold()
        );

        Product savedProduct = productRepository.save(product);

        // Record initial stock transaction if quantity > 0
        if (savedProduct.getQuantity() != null && savedProduct.getQuantity() > 0) {
            InventoryTransaction transaction = new InventoryTransaction(
                    savedProduct,
                    TransactionType.ADD,
                    savedProduct.getQuantity(),
                    savedProduct.getUnit(),
                    "Initial stock"
            );
            transactionRepository.save(transaction);
        }

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product existing = getProductById(id);
        validateUnit(request.getUnit());

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("Product name cannot be empty");
        }
        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new ValidationException("Quantity cannot be negative");
        }
        if (request.getSellingPrice() != null && request.getSellingPrice() < 0) {
            throw new ValidationException("Selling price cannot be negative");
        }
        if (request.getCostPrice() != null && request.getCostPrice() < 0) {
            throw new ValidationException("Cost price cannot be negative");
        }
        if (request.getLowStockThreshold() != null && request.getLowStockThreshold() < 0) {
            throw new ValidationException("Low stock threshold cannot be negative");
        }

        existing.setName(request.getName().trim());
        existing.setCategory(request.getCategory().trim());
        existing.setQuantity(request.getQuantity());
        existing.setUnit(request.getUnit());
        existing.setSellingPrice(request.getSellingPrice());
        existing.setCostPrice(request.getCostPrice());
        existing.setLowStockThreshold(request.getLowStockThreshold());

        return productRepository.save(existing);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product existing = getProductById(id);
        // Delete all associated transactions first
        List<InventoryTransaction> transactions = transactionRepository.findByProductIdOrderByCreatedAtDesc(id);
        transactionRepository.deleteAll(transactions);
        productRepository.delete(existing);
    }

    @Transactional
    public Product addStock(Long id, StockAdjustmentRequest request) {
        Product product = getProductById(id);

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ValidationException("Quantity to add must be greater than zero");
        }

        String unit = resolveAdjustmentUnit(product, request.getUnit());

        String reason = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim()
                : "New stock received";

        double newQuantity = product.getQuantity() + request.getQuantity();
        product.setQuantity(newQuantity);

        Product updatedProduct = productRepository.save(product);

        InventoryTransaction transaction = new InventoryTransaction(
                updatedProduct,
                TransactionType.ADD,
                request.getQuantity(),
                unit,
                reason
        );
        transactionRepository.save(transaction);

        return updatedProduct;
    }

    @Transactional
    public Product removeStock(Long id, StockAdjustmentRequest request) {
        Product product = getProductById(id);

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ValidationException("Quantity to remove must be greater than zero");
        }

        String unit = resolveAdjustmentUnit(product, request.getUnit());

        double currentStock = product.getQuantity();
        double quantityToRemove = request.getQuantity();

        // Business rule: Never allow stock to become negative
        if (currentStock < quantityToRemove) {
            throw new InsufficientStockException(currentStock, product.getUnit());
        }

        String reason = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim()
                : "Stock sold";

        double newQuantity = currentStock - quantityToRemove;
        product.setQuantity(newQuantity);

        Product updatedProduct = productRepository.save(product);

        InventoryTransaction transaction = new InventoryTransaction(
                updatedProduct,
                TransactionType.REMOVE,
                quantityToRemove,
                unit,
                reason
        );
        transactionRepository.save(transaction);

        return updatedProduct;
    }

    @Transactional(readOnly = true)
    public List<InventoryTransaction> getProductTransactions(Long id) {
        // Ensure product exists
        getProductById(id);
        return transactionRepository.findByProductIdOrderByCreatedAtDesc(id);
    }
}
