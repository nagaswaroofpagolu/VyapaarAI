package com.vyapaarai.service;

import com.vyapaarai.dto.VoiceCommandRequest;
import com.vyapaarai.dto.VoiceCommandResponse;
import com.vyapaarai.entity.Product;
import com.vyapaarai.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VoiceCommandServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Test
    void interpretsEnglishAddCommandWithoutChangingStock() {
        Product salt = product("Salt", 10.0, "packets");
        when(productRepository.findAll()).thenReturn(List.of(salt));

        VoiceCommandResponse result = new VoiceCommandService(productRepository).interpret(
                new VoiceCommandRequest("Add 15 packets of salt", "en-IN")
        );

        assertTrue(result.isValid());
        assertEquals("ADD", result.getAction());
        assertEquals("Salt", result.getProductName());
        assertEquals(15.0, result.getQuantity());
        assertEquals("packets", result.getUnit());
    }

    @Test
    void interpretsMixedLanguageRemoveCommand() {
        Product rice = product("Rice", 25.0, "bags");
        when(productRepository.findAll()).thenReturn(List.of(rice));

        VoiceCommandResponse result = new VoiceCommandService(productRepository).interpret(
                new VoiceCommandRequest("Rice 5 bags add cheyyi", "mixed")
        );

        assertTrue(result.isValid());
        assertEquals("ADD", result.getAction());
        assertEquals("Rice", result.getProductName());
        assertEquals(5.0, result.getQuantity());
        assertEquals("bags", result.getUnit());
    }

    @Test
    void interpretsRequestedNaturalNumberWordCommands() {
        Product rice = product("Rice", 25.0, "bags");
        Product biscuits = product("Biscuits", 18.0, "cartons");
        when(productRepository.findAll()).thenReturn(List.of(rice, biscuits));
        VoiceCommandService service = new VoiceCommandService(productRepository);

        VoiceCommandResponse remove = service.interpret(new VoiceCommandRequest("remove two bags of rice", "en-IN"));
        VoiceCommandResponse add = service.interpret(new VoiceCommandRequest("add five bags of rice", "en-IN"));
        VoiceCommandResponse productFirst = service.interpret(new VoiceCommandRequest("rice two bags add", "en-IN"));
        VoiceCommandResponse received = service.interpret(new VoiceCommandRequest("two bags of rice received", "en-IN"));
        VoiceCommandResponse sold = service.interpret(new VoiceCommandRequest("sold three boxes of biscuits", "en-IN"));

        assertEquals(2.0, remove.getQuantity());
        assertEquals(5.0, add.getQuantity());
        assertEquals(2.0, productFirst.getQuantity());
        assertEquals(2.0, received.getQuantity());
        assertEquals(3.0, sold.getQuantity());
        assertEquals("REMOVE", remove.getAction());
        assertEquals("ADD", add.getAction());
        assertEquals("ADD", productFirst.getAction());
        assertEquals("ADD", received.getAction());
        assertEquals("REMOVE", sold.getAction());
        assertEquals("cartons", sold.getUnit());
    }

    @Test
    void interpretsTeluguScriptAddCommand() {
        Product rice = product("Rice", 25.0, "bags");
        when(productRepository.findAll()).thenReturn(List.of(rice));

        VoiceCommandResponse result = new VoiceCommandService(productRepository).interpret(
                new VoiceCommandRequest("రైస్ 5 బ్యాగ్స్ యాడ్ చేయి", "te-IN")
        );

        assertTrue(result.isValid());
        assertEquals("ADD", result.getAction());
        assertEquals("Rice", result.getProductName());
        assertEquals(5.0, result.getQuantity());
        assertEquals("bags", result.getUnit());
    }

    @Test
    void interpretsTeluguScriptRemoveCommand() {
        Product rice = product("Rice", 25.0, "bags");
        when(productRepository.findAll()).thenReturn(List.of(rice));

        VoiceCommandResponse result = new VoiceCommandService(productRepository).interpret(
                new VoiceCommandRequest("రైస్ 2 బ్యాగ్స్ తీసేయి", "te-IN")
        );

        assertTrue(result.isValid());
        assertEquals("REMOVE", result.getAction());
        assertEquals("Rice", result.getProductName());
        assertEquals(2.0, result.getQuantity());
        assertEquals("bags", result.getUnit());
    }

        @Test
        void interpretsUnseenSupplierAndSaleWordingWithNumberWords() {
        Product rice = product("Rice", 25.0, "bags");
        Product biscuits = product("Biscuits", 18.0, "cartons");
        when(productRepository.findAll()).thenReturn(List.of(rice, biscuits));
        VoiceCommandService service = new VoiceCommandService(productRepository);

        VoiceCommandResponse received = service.interpret(new VoiceCommandRequest(
            "Hey, we just got 10 rice bags from the wholesaler", "en-IN"));
        VoiceCommandResponse sold = service.interpret(new VoiceCommandRequest(
            "Take three biscuit cartons out because they were sold", "en-IN"));

        assertEquals("STOCK_ADD", received.getIntent());
        assertEquals("Rice", received.getProductName());
        assertEquals(10.0, received.getQuantity());
        assertEquals("STOCK_REMOVE", sold.getIntent());
        assertEquals("Biscuits", sold.getProductName());
        assertEquals(3.0, sold.getQuantity());
        }

        @Test
        void classifiesProductChangeRequestsWithoutMutating() {
        VoiceCommandService service = new VoiceCommandService(productRepository);

        VoiceCommandResponse create = service.interpret(new VoiceCommandRequest(
            "I want to add Basmati Rice as a product", "en-IN"));
        VoiceCommandResponse update = service.interpret(new VoiceCommandRequest(
            "Make rice price 900", "en-IN"));
        VoiceCommandResponse delete = service.interpret(new VoiceCommandRequest(
            "Delete that test product", "en-IN"));

        assertEquals("PRODUCT_CREATE", create.getIntent());
        assertEquals("PRODUCT_UPDATE", update.getIntent());
        assertEquals("PRODUCT_DELETE", delete.getIntent());
        assertFalse(create.isValid());
        assertFalse(update.isValid());
        assertFalse(delete.isValid());
        }

    @Test
    void preparesConfirmedDeleteAndPriceUpdateProposals() {
        Product rice = product("Rice", 25.0, "bags");
        when(productRepository.findAll()).thenReturn(List.of(rice));
        VoiceCommandService service = new VoiceCommandService(productRepository);

        VoiceCommandResponse update = service.interpret(new VoiceCommandRequest("Make rice price 900", "en-IN"));
        VoiceCommandResponse delete = service.interpret(new VoiceCommandRequest("Remove Rice", "en-IN"));

        assertTrue(update.isValid());
        assertEquals("PRODUCT_UPDATE", update.getIntent());
        assertEquals(900.0, update.getPrice());
        assertTrue(delete.isValid());
        assertEquals("PRODUCT_DELETE", delete.getIntent());
        assertEquals("Rice", delete.getProductName());
    }

    @Test
    void rejectsUnknownProductAndInvalidCommand() {
        when(productRepository.findAll()).thenReturn(List.of(product("Salt", 10.0, "packets")));
        VoiceCommandService service = new VoiceCommandService(productRepository);

        VoiceCommandResponse unknownProduct = service.interpret(
                new VoiceCommandRequest("Add 2 packets of flour", "en-IN")
        );
        VoiceCommandResponse invalid = service.interpret(
                new VoiceCommandRequest("Tell me something", "en-IN")
        );

        assertFalse(unknownProduct.isValid());
        assertFalse(invalid.isValid());
    }

    private Product product(String name, double quantity, String unit) {
        Product product = new Product(name, "Test", quantity, unit, 100.0, 80.0, 5.0);
        product.setId(1L);
        return product;
    }
}
