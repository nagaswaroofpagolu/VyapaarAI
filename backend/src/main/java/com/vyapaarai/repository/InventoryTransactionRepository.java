package com.vyapaarai.repository;

import com.vyapaarai.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT t FROM InventoryTransaction t WHERE t.product.id = :productId ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);

    List<InventoryTransaction> findTop15ByOrderByCreatedAtDesc();
}
