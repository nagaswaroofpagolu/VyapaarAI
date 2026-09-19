package com.vyapaarai.service;

import com.vyapaarai.dto.AssistantAnswerResponse;
import com.vyapaarai.dto.AssistantQuestionRequest;
import com.vyapaarai.entity.Product;
import com.vyapaarai.entity.InventoryTransaction;
import com.vyapaarai.repository.InventoryTransactionRepository;
import com.vyapaarai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AssistantService {

    private static final Map<String, String> LANGUAGE_ALIASES = createLanguageAliases();

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;

    public AssistantService(ProductRepository productRepository,
                            InventoryTransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public AssistantAnswerResponse answer(AssistantQuestionRequest request) {
        String question = request != null && request.getQuestion() != null
                ? request.getQuestion().trim()
                : "";
        if (question.isEmpty()) {
            return response("Please ask an inventory question.", "UNKNOWN", List.of(), List.of());
        }

        String normalized = normalize(question);
        List<Product> products = productRepository.findAll();
        List<Product> reorderProducts = products.stream()
                .filter(this::needsReorder)
                .sorted(Comparator.comparing(Product::getQuantity))
                .toList();

        if (isReorderQuestion(normalized)) {
            return reorderAnswer(reorderProducts);
        }
        if (isLowStockQuestion(normalized)) {
            List<Product> lowStock = products.stream()
                    .filter(product -> product.getQuantity() > 0 && needsReorder(product))
                    .sorted(Comparator.comparing(Product::getQuantity))
                    .toList();
            return productListAnswer(lowStock, "LOW_STOCK", "low-stock");
        }
        if (isOutOfStockQuestion(normalized)) {
            List<Product> outOfStock = products.stream()
                    .filter(product -> product.getQuantity() <= 0)
                    .toList();
            return productListAnswer(outOfStock, "OUT_OF_STOCK", "out-of-stock");
        }
        if (isSummaryQuestion(normalized)) {
            double value = products.stream()
                    .mapToDouble(product -> product.getQuantity() * product.getSellingPrice())
                    .sum();
            long lowStockCount = products.stream().filter(this::needsReorder).count();
            long outOfStockCount = products.stream().filter(product -> product.getQuantity() <= 0).count();
            String answer = String.format(Locale.ROOT,
                    "You have %d products. Inventory value is INR %.2f. %d are low or out of stock, including %d out of stock.",
                    products.size(), value, lowStockCount, outOfStockCount);
            return response(answer, "SUMMARY", products, reorderProducts);
        }

        if (isInventoryValueQuestion(normalized)) {
            double value = products.stream()
                    .mapToDouble(product -> product.getQuantity() * product.getSellingPrice())
                    .sum();
            return response(String.format(Locale.ROOT, "Your current inventory value is INR %.2f.", value),
                    "INVENTORY_VALUE", products, reorderProducts);
        }

        Optional<Product> transactionProduct = findProduct(products, normalized);
        if (isTransactionQuestion(normalized)) {
            List<InventoryTransaction> transactions = transactionProduct.isPresent()
                    ? transactionRepository.findByProductIdOrderByCreatedAtDesc(transactionProduct.get().getId())
                    : transactionRepository.findTop15ByOrderByCreatedAtDesc();
            return transactionAnswer(transactions, transactionProduct.map(Product::getName).orElse(null));
        }

        if (isProductListQuestion(normalized)) {
            String names = products.stream().map(Product::getName).collect(Collectors.joining(", "));
            return response(products.isEmpty() ? "There are no products in your inventory."
                            : "Your products are: " + names + ".", "PRODUCT_LIST", products, reorderProducts);
        }

        Optional<Product> product = findProduct(products, normalized);
        if (product.isEmpty() && request != null && request.getContextProductName() != null
                && containsAny(normalized, "that", "enough", "it", "this")) {
            product = findProduct(products, normalize(request.getContextProductName()));
        }
        if (product.isPresent() && isQuantityQuestion(normalized)) {
            Product item = product.get();
            String answer = String.format(Locale.ROOT,
                    "%s has %s %s available. Its low-stock threshold is %s %s and its status is %s.",
                    item.getName(), formatQuantity(item.getQuantity()), item.getUnit(),
                    formatQuantity(item.getLowStockThreshold()), item.getUnit(), item.getStockStatus());
            return response(answer, "PRODUCT_STOCK", List.of(item), needsReorder(item) ? List.of(item) : List.of());
        }

        return response("I can help with your products, stock, inventory, transactions, low-stock items and reorder information.",
                "UNKNOWN", List.of(), reorderProducts);
    }

    private AssistantAnswerResponse reorderAnswer(List<Product> products) {
        if (products.isEmpty()) {
            return response("No products currently need reordering based on their configured thresholds.",
                    "REORDER", List.of(), List.of());
        }
        String names = products.stream().map(product -> product.getName() + " (" + formatQuantity(product.getQuantity())
                        + " " + product.getUnit() + ", threshold " + formatQuantity(product.getLowStockThreshold()) + ")")
                .collect(Collectors.joining(", "));
        return response("Order or restock these products: " + names + ".", "REORDER", products, products);
    }

    private AssistantAnswerResponse productListAnswer(List<Product> products, String intent, String label) {
        if (products.isEmpty()) {
            return response("No products are currently " + label + " based on their configured thresholds.",
                    intent, List.of(), List.of());
        }
        String names = products.stream().map(product -> product.getName() + " (" + formatQuantity(product.getQuantity())
                        + " " + product.getUnit() + ")").collect(Collectors.joining(", "));
        return response("These products are " + label + ": " + names + ".", intent, products, products);
    }

    private Optional<Product> findProduct(List<Product> products, String question) {
        return products.stream()
                .filter(product -> productMatches(question, product.getName()))
                .sorted((left, right) -> Integer.compare(right.getName().length(), left.getName().length()))
                .findFirst();
    }

    private boolean needsReorder(Product product) {
        return product.getQuantity() <= product.getLowStockThreshold();
    }

    private static boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private static String normalize(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> alias : LANGUAGE_ALIASES.entrySet()) {
            normalized = normalized.replace(alias.getKey(), " " + alias.getValue() + " ");
        }
        return normalized.replaceAll("[.,!?]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean isReorderQuestion(String question) {
        return containsAny(question, "reorder", "re-order", "restock", "restocking", "need to buy",
                "need buy", "should buy", "purchase", "should order", "order today", "order now",
                "buy today", "buy now", "order", "buy", "రీఆర్డర్");
    }

    private static boolean isLowStockQuestion(String question) {
        return containsAny(question, "low stock", "low inventory", "running low", "stock is low",
                "products are low", "items are low", "which products are low", "need attention",
                "almost finished", "almost over", "తక్కువ", "low");
    }

    private static boolean isOutOfStockQuestion(String question) {
        return containsAny(question, "out of stock", "out stock", "no stock", "no inventory",
                "finished", "have no stock", "zero stock", "empty", "అయిపోయింది", "ఖాళీ");
    }

    private static boolean isSummaryQuestion(String question) {
        return containsAny(question, "summary", "inventory summary", "stock report", "inventory report",
                "stock status", "how is my stock", "how is stock", "give me a report", "show me a report",
                "inventory overview", "total products", "how many products");
    }

    private static boolean isQuantityQuestion(String question) {
        return containsAny(question, "how much", "how many", "available", "do i have", "are there",
            "have", "left", "enough", "check", "show me", "tell me", "stock", "quantity", "inventory", "entha undi",
                "entha", "ఎంత ఉంది", "ఎంత");
    }

        private static boolean isInventoryValueQuestion(String question) {
        return containsAny(question, "inventory value", "stock value", "money tied", "money invested",
            "worth of my stock", "how much money", "valuation");
        }

        private static boolean isTransactionQuestion(String question) {
        return containsAny(question, "transaction", "transactions", "what happened", "stock movement",
            "stock history", "activity", "came in", "received today", "sold today", "what came");
        }

        private static boolean isProductListQuestion(String question) {
        return containsAny(question, "list products", "show products", "which products do i have",
            "what products do i have", "my products", "product list");
        }

        private static boolean productMatches(String question, String productName) {
        String name = normalize(productName);
        return question.contains(name)
            || (name.endsWith("s") && question.contains(name.substring(0, name.length() - 1)))
            || (!name.endsWith("s") && question.contains(name + "s"));
        }

        private AssistantAnswerResponse transactionAnswer(List<InventoryTransaction> transactions, String productName) {
        if (transactions.isEmpty()) {
            return response(productName == null ? "No recent stock activity was found."
                    : "No stock activity was found for " + productName + ".",
                "TRANSACTION_HISTORY", List.of(), List.of());
        }
        String answer = transactions.stream()
            .limit(5)
            .map(transaction -> ("ADD".equals(transaction.getType().name()) ? "Added " : "Removed ")
                + formatQuantity(transaction.getQuantity()) + " " + transaction.getUnit()
                + (transaction.getProductName() == null ? "" : " of " + transaction.getProductName()))
            .collect(Collectors.joining("; ", "Recent stock activity: ", "."));
        return response(answer, "TRANSACTION_HISTORY", List.of(), List.of());
        }

    private static Map<String, String> createLanguageAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("ఏ స్టాక్ తక్కువగా ఉంది", "which stock is low");
        aliases.put("ఈరోజు ఏవి రీఆర్డర్ చేయాలి", "what should reorder today");
        aliases.put("రీఆర్డర్", "reorder");
        aliases.put("కొనాలి", "purchase");
        aliases.put("ఆర్డర్ చేయాలి", "order");
        aliases.put("తక్కువగా ఉంది", "low");
        aliases.put("తక్కువ", "low");
        aliases.put("ఎంత ఉంది", "how much");
        aliases.put("ఎంత", "how much");
        aliases.put("ఏవి", "which");
        aliases.put("రైస్", "rice");
        aliases.put("రైస", "rice");
        aliases.put("సాల్ట్", "salt");
        aliases.put("ఆయిల్", "oil");
        aliases.put("షుగర్", "sugar");
        aliases.put("ఫ్లోర్", "flour");
        aliases.put("టీ", "tea");
        aliases.put("బిస్కెట్లు", "biscuits");
        aliases.put("అయిపోయింది", "finished");
        aliases.put("ఖాళీ", "empty");
        return aliases;
    }

    private static String formatQuantity(double quantity) {
        return quantity == (long) quantity ? String.valueOf((long) quantity) : String.valueOf(quantity);
    }

    private static AssistantAnswerResponse response(String answer, String intent,
                                                    List<Product> products,
                                                    List<Product> reorderProducts) {
        return new AssistantAnswerResponse(answer, intent, products, reorderProducts);
    }
}
