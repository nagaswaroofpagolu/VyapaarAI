package com.vyapaarai.service;

import com.vyapaarai.dto.ProductRequest;
import com.vyapaarai.dto.StockAdjustmentRequest;
import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.entity.Product;
import com.vyapaarai.entity.TransactionType;
import com.vyapaarai.exception.InsufficientStockException;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, transactionRepository);
    }

    @Test
    void completesStockFlowAndRejectsNegativeStock() {
        Product product = new Product("Rice", "Grains", 10.0, "bags", 2500.0, 2200.0, 3.0);
        product.setId(1L);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Product created = productService.createProduct(new ProductRequest(
                "Rice", "Grains", 10.0, "bags", 2500.0, 2200.0, 3.0
        ));
        double createdQuantity = created.getQuantity();
        Product afterAdd = productService.addStock(1L,
                new StockAdjustmentRequest(5.0, "bags", "Supplier delivery"));
        double quantityAfterAdd = afterAdd.getQuantity();
        Product afterRemove = productService.removeStock(1L,
                new StockAdjustmentRequest(4.0, "bags", "Customer sale"));
        double quantityAfterRemove = afterRemove.getQuantity();

        assertEquals(10.0, createdQuantity);
        assertEquals(15.0, quantityAfterAdd);
        assertEquals(11.0, quantityAfterRemove);

        when(transactionRepository.findByProductIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                transaction(TransactionType.REMOVE, 4.0, "Customer sale"),
                transaction(TransactionType.ADD, 5.0, "Supplier delivery")
        ));
        List<InventoryTransaction> history = productService.getProductTransactions(1L);
        assertEquals(2, history.size());
        assertEquals(TransactionType.REMOVE, history.get(0).getType());

                clearInvocations(productRepository);
        assertThrows(InsufficientStockException.class, () -> productService.removeStock(1L,
                new StockAdjustmentRequest(12.0, "bags", "Oversell attempt")));
        assertEquals(11.0, product.getQuantity());
        verify(productRepository, never()).save(any(Product.class));

        ArgumentCaptor<InventoryTransaction> transactionCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository, org.mockito.Mockito.times(3)).save(transactionCaptor.capture());
        assertEquals(TransactionType.ADD, transactionCaptor.getAllValues().get(0).getType());
        assertEquals(TransactionType.ADD, transactionCaptor.getAllValues().get(1).getType());
        assertEquals(TransactionType.REMOVE, transactionCaptor.getAllValues().get(2).getType());
    }

    @Test
    void rejectsAdjustmentWithDifferentUnit() {
        Product product = new Product("Rice", "Grains", 10.0, "bags", 2500.0, 2200.0, 3.0);
        product.setId(1L);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(com.vyapaarai.exception.ValidationException.class, () -> productService.addStock(1L,
                new StockAdjustmentRequest(2.0, "kg", "Wrong unit")));
        verify(productRepository, never()).save(any(Product.class));
        verify(transactionRepository, never()).save(any(InventoryTransaction.class));
    }

    private InventoryTransaction transaction(TransactionType type, double quantity, String reason) {
        return new InventoryTransaction(null, type, quantity, "bags", reason);
    }
}
