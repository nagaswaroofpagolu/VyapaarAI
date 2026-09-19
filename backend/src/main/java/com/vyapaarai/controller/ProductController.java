package com.vyapaarai.controller;

import com.vyapaarai.dto.ProductRequest;
import com.vyapaarai.dto.StockAdjustmentRequest;
import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;
import com.vyapaarai.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        Product created = productService.createProduct(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id,
                                                @Valid @RequestBody ProductRequest request) {
        Product updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of(
                "message", "Product deleted successfully",
                "id", String.valueOf(id)
        ));
    }

    @PostMapping("/{id}/stock/add")
    public ResponseEntity<Product> addStock(@PathVariable Long id,
                                            @Valid @RequestBody StockAdjustmentRequest request) {
        Product updated = productService.addStock(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/stock/remove")
    public ResponseEntity<Product> removeStock(@PathVariable Long id,
                                               @Valid @RequestBody StockAdjustmentRequest request) {
        Product updated = productService.removeStock(id, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<InventoryTransaction>> getProductTransactions(@PathVariable Long id) {
        List<InventoryTransaction> transactions = productService.getProductTransactions(id);
        return ResponseEntity.ok(transactions);
    }
}
