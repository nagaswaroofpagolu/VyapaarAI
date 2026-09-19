package com.vyapaarai.service;

import com.vyapaarai.dto.AssistantAnswerResponse;
import com.vyapaarai.dto.AssistantQuestionRequest;
import com.vyapaarai.entity.Product;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Test
    void answersProductQuantityFromDatabaseValues() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        when(productRepository.findAll()).thenReturn(List.of(rice));

        AssistantAnswerResponse result = new AssistantService(productRepository, transactionRepository).answer(
                new AssistantQuestionRequest("How much rice is available?", "en-IN")
        );

        assertEquals("PRODUCT_STOCK", result.getIntent());
        assertTrue(result.getAnswer().contains("7 bags"));
        assertTrue(result.getAnswer().contains("threshold is 10 bags"));
    }

    @Test
    void answersNaturalQuantityQuestionsInEnglishAndMixedLanguage() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        when(productRepository.findAll()).thenReturn(List.of(rice));
        AssistantService service = new AssistantService(productRepository, transactionRepository);

        AssistantAnswerResponse english = service.answer(
                new AssistantQuestionRequest("How many bags of rice are there?", "en-IN"));
        AssistantAnswerResponse mixed = service.answer(
                new AssistantQuestionRequest("Rice stock entha undi?", "mixed"));

        assertEquals("PRODUCT_STOCK", english.getIntent());
        assertEquals("PRODUCT_STOCK", mixed.getIntent());
        assertTrue(mixed.getAnswer().contains("7 bags"));
    }

    @Test
    void recommendsProductsUsingTheirActualThresholds() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        Product salt = product("Salt", 20.0, "packets", 5.0);
        when(productRepository.findAll()).thenReturn(List.of(rice, salt));

        AssistantAnswerResponse result = new AssistantService(productRepository, transactionRepository).answer(
                new AssistantQuestionRequest("What should I reorder today?", "en-IN")
        );

        assertEquals("REORDER", result.getIntent());
        assertEquals(1, result.getReorderRecommendations().size());
        assertEquals("Rice", result.getReorderRecommendations().get(0).getName());
        assertTrue(result.getAnswer().contains("Rice"));
        assertTrue(!result.getAnswer().contains("Salt"));
    }

    @Test
    void listsOutOfStockProducts() {
        Product oil = product("Oil", 0.0, "litres", 2.0);
        when(productRepository.findAll()).thenReturn(List.of(oil));

        AssistantAnswerResponse result = new AssistantService(productRepository, transactionRepository).answer(
                new AssistantQuestionRequest("What is out of stock?", "en-IN")
        );

        assertEquals("OUT_OF_STOCK", result.getIntent());
        assertEquals(1, result.getProducts().size());
        assertTrue(result.getAnswer().contains("Oil"));
    }

    @Test
    void recognizesNaturalLowStockAndSummaryQuestions() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        when(productRepository.findAll()).thenReturn(List.of(rice));
        AssistantService service = new AssistantService(productRepository, transactionRepository);

        AssistantAnswerResponse low = service.answer(
                new AssistantQuestionRequest("Which items need attention?", "en-IN"));
        AssistantAnswerResponse summary = service.answer(
                new AssistantQuestionRequest("Give me a stock report", "en-IN"));

        assertEquals("LOW_STOCK", low.getIntent());
        assertEquals("SUMMARY", summary.getIntent());
        assertTrue(summary.getAnswer().contains("1 products"));
    }

    @Test
    void returnsHelpfulFallbackForUnrelatedQuestions() {
        when(productRepository.findAll()).thenReturn(List.of(product("Rice", 7.0, "bags", 10.0)));

        AssistantAnswerResponse result = new AssistantService(productRepository, transactionRepository).answer(
                new AssistantQuestionRequest("Tell me a joke", "en-IN"));

        assertEquals("UNKNOWN", result.getIntent());
        assertTrue(result.getAnswer().contains("inventory"));
    }

    @Test
    void answersUnseenNaturalQuantityAndValueQuestions() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        when(productRepository.findAll()).thenReturn(List.of(rice));
        AssistantService service = new AssistantService(productRepository, transactionRepository);

        AssistantAnswerResponse quantity = service.answer(new AssistantQuestionRequest(
                "Can you check what's left in rice?", "en-IN"));
        AssistantAnswerResponse value = service.answer(new AssistantQuestionRequest(
                "How much money is tied up in inventory?", "en-IN"));

        assertEquals("PRODUCT_STOCK", quantity.getIntent());
        assertTrue(quantity.getAnswer().contains("7 bags"));
        assertEquals("INVENTORY_VALUE", value.getIntent());
        assertTrue(value.getAnswer().contains("700.00"));
    }

    @Test
    void resolvesContextualFollowUpQuestion() {
        Product rice = product("Rice", 7.0, "bags", 10.0);
        when(productRepository.findAll()).thenReturn(List.of(rice));
        AssistantQuestionRequest request = new AssistantQuestionRequest("Is that enough?", "en-IN");
        request.setContextProductName("Rice");

        AssistantAnswerResponse result = new AssistantService(productRepository, transactionRepository).answer(request);

        assertEquals("PRODUCT_STOCK", result.getIntent());
        assertTrue(result.getAnswer().contains("7 bags"));
    }

    private Product product(String name, double quantity, String unit, double threshold) {
        Product product = new Product(name, "Test", quantity, unit, 100.0, 80.0, threshold);
        product.setId((long) name.hashCode());
        return product;
    }
}
