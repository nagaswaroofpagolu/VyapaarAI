package com.vyapaarai.service;

import com.vyapaarai.dto.VoiceCommandRequest;
import com.vyapaarai.dto.VoiceCommandResponse;
import com.vyapaarai.entity.Product;
import com.vyapaarai.entity.TradeUnit;
import com.vyapaarai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VoiceCommandService {

    private static final Pattern QUANTITY_PATTERN = Pattern.compile("(?:^|\\s)(\\d+(?:\\.\\d+)?)\\s*([a-zA-Z]+)?(?:\\s|$)");
    private static final Pattern NUMBER_WORD_PATTERN = Pattern.compile("(?:^|\\s)(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)(?:\\s+([a-zA-Z]+))?(?:\\s|$)");
    private static final Pattern PRICE_PATTERN = Pattern.compile("(?:price|selling price|at)\\s*(?:to|is|of)?\\s*(\\d+(?:\\.\\d+)?)");
    private static final Map<String, String> UNIT_ALIASES = createUnitAliases();
    private static final Map<String, String> TELUGU_ALIASES = createTeluguAliases();

    private final ProductRepository productRepository;

    public VoiceCommandService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public VoiceCommandResponse interpret(VoiceCommandRequest request) {
        String transcript = request != null && request.getTranscript() != null
                ? request.getTranscript().trim()
                : "";
        if (transcript.isEmpty()) {
            return VoiceCommandResponse.invalid("I could not hear a stock command. Please try again.", transcript);
        }

        String normalized = normalize(transcript);
        List<Product> products = productRepository.findAll();
        VoiceCommandResponse nonStockIntent = detectNonStockIntent(normalized, transcript, products);
        if (nonStockIntent != null) {
            return nonStockIntent;
        }
        String action = detectAction(normalized);
        if (action == null) {
            return invalid("I could not identify whether stock was added or removed. Did the stock arrive, or was it sold/used?", transcript,
                "STOCK_COMMAND", "Please clarify whether this is an add or remove operation.");
        }

        QuantityAndUnit quantityAndUnit = extractQuantityAndUnit(normalized);
        if (quantityAndUnit.quantity == null || quantityAndUnit.quantity <= 0) {
            return invalid("How much stock should I " + ("ADD".equals(action) ? "add" : "remove") + ", and what unit should I use?", transcript,
                "ADD".equals(action) ? "STOCK_ADD" : "STOCK_REMOVE", "Quantity and unit are required.");
        }

        Optional<Product> matchedProduct = products.stream()
            .filter(product -> productMatches(normalized, product.getName()))
                .sorted((left, right) -> Integer.compare(right.getName().length(), left.getName().length()))
                .findFirst();
        if (matchedProduct.isEmpty()) {
            return invalid("Which product should I update? I could not match that name to your inventory.", transcript,
                "ADD".equals(action) ? "STOCK_ADD" : "STOCK_REMOVE", "A product in your inventory is required.");
        }

        Product product = matchedProduct.get();
        String unit = quantityAndUnit.unit != null ? quantityAndUnit.unit : product.getUnit();
        if (!unit.equals(product.getUnit()) && areNaturalUnitSynonyms(unit, product.getUnit())) {
            unit = product.getUnit();
        }
        if (!unit.equals(product.getUnit())) {
            return invalid("Use " + product.getUnit() + " for " + product.getName() + ".", transcript,
                "ADD".equals(action) ? "STOCK_ADD" : "STOCK_REMOVE", "The unit must match the product unit.");
        }

        String message = ("ADD".equals(action) ? "Add " : "Remove ")
                + formatQuantity(quantityAndUnit.quantity) + " " + unit + " of " + product.getName();
        VoiceCommandResponse response = new VoiceCommandResponse(
                true, message, action, product.getId(), product.getName(),
                quantityAndUnit.quantity, unit, transcript
        );
        response.setIntent("ADD".equals(action) ? "STOCK_ADD" : "STOCK_REMOVE");
        return response;
    }

    private String detectAction(String normalized) {
        if (containsAny(normalized, "remove", "removing", "sell", "sold", "used", "use", "consumed", "deduct", "minus", "take out", "take", "dispatch", "teesey", "teesuko", "teesukondi", "తీసేయి", "తీసేయండి")) {
            return "REMOVE";
        }
        if (containsAny(normalized, "add", "adding", "receive", "received", "supplier", "delivered", "delivery", "arrived", "got", "came", "restock", "stock in", "plus", "cheyyi", "pettu", "చేర్చు", "పెట్టు")) {
            return "ADD";
        }
        return null;
    }

        private VoiceCommandResponse detectNonStockIntent(String normalized, String transcript, List<Product> products) {
        if (containsAny(normalized, "delete product", "remove product", "delete", "remove that product")
            || (normalized.startsWith("remove ") && !normalized.matches(".*\\d.*")
                && !containsNumberWord(normalized) && !containsAny(normalized, "stock", "inventory"))) {
            Optional<Product> product = products.stream().filter(item -> productMatches(normalized, item.getName())).findFirst();
            if (product.isEmpty()) {
            return invalid("Which product should I delete? I could not match that name to your inventory.", transcript,
                "PRODUCT_DELETE", "An identified product and confirmation are required.");
            }
            VoiceCommandResponse response = new VoiceCommandResponse(true,
                "Delete " + product.get().getName() + " from inventory", "DELETE", product.get().getId(),
                product.get().getName(), null, null, transcript, "PRODUCT_DELETE", null);
            return response;
        }
        if (containsAny(normalized, "create product", "new product", "add product", "as a product", "make a new product")) {
            return invalid("What category, starting quantity, unit, prices, and low-stock threshold should I use for the new product?",
                    transcript, "PRODUCT_CREATE", "Product name was detected, but required product details are missing.");
        }
        if (containsAny(normalized, "change", "update", "set price", "price", "selling price", "low-stock threshold")) {
            Optional<Product> product = products.stream().filter(item -> productMatches(normalized, item.getName())).findFirst();
            Matcher priceMatcher = PRICE_PATTERN.matcher(normalized);
            if (product.isPresent() && priceMatcher.find()) {
            VoiceCommandResponse response = new VoiceCommandResponse(true,
                "Update " + product.get().getName() + " selling price to INR " + priceMatcher.group(1),
                "UPDATE", product.get().getId(), product.get().getName(), null, product.get().getUnit(),
                transcript, "PRODUCT_UPDATE", null);
            response.setPrice(Double.valueOf(priceMatcher.group(1)));
            return response;
            }
            return invalid("What would you like to change about the product: price, category, or low-stock threshold?",
                transcript, "PRODUCT_UPDATE", "The product update field and value need clarification.");
        }
        return null;
    }

    private QuantityAndUnit extractQuantityAndUnit(String normalized) {
        Matcher matcher = QUANTITY_PATTERN.matcher(normalized);
        while (matcher.find()) {
            Double quantity = Double.valueOf(matcher.group(1));
            String unit = matcher.group(2) == null ? null : UNIT_ALIASES.get(matcher.group(2));
            if (unit != null) {
                return new QuantityAndUnit(quantity, unit);
            }
            String remainder = normalized.substring(matcher.end());
            for (String token : remainder.split("\\s+")) {
                unit = UNIT_ALIASES.get(token);
                if (unit != null) {
                    return new QuantityAndUnit(quantity, unit);
                }
                if (!token.matches("[a-zA-Z]+")) {
                    break;
                }
            }
            if (matcher.group(2) == null) {
                return new QuantityAndUnit(quantity, null);
            }
        }
        Matcher wordMatcher = NUMBER_WORD_PATTERN.matcher(normalized);
        while (wordMatcher.find()) {
            Double quantity = numberWordValue(wordMatcher.group(1));
            String unit = wordMatcher.group(2) == null ? null : UNIT_ALIASES.get(wordMatcher.group(2));
            if (unit != null) {
                return new QuantityAndUnit(quantity, unit);
            }
            for (String token : normalized.substring(wordMatcher.end()).split("\\s+")) {
                unit = UNIT_ALIASES.get(token);
                if (unit != null) {
                    return new QuantityAndUnit(quantity, unit);
                }
                if (!token.matches("[a-zA-Z]+")) {
                    break;
                }
            }
            if (wordMatcher.group(2) == null) {
                return new QuantityAndUnit(quantity, null);
            }
        }
        return new QuantityAndUnit(null, null);
    }

    private static Double numberWordValue(String word) {
        return switch (word) {
            case "zero" -> 0d;
            case "one" -> 1d;
            case "two" -> 2d;
            case "three" -> 3d;
            case "four" -> 4d;
            case "five" -> 5d;
            case "six" -> 6d;
            case "seven" -> 7d;
            case "eight" -> 8d;
            case "nine" -> 9d;
            case "ten" -> 10d;
            case "eleven" -> 11d;
            case "twelve" -> 12d;
            case "thirteen" -> 13d;
            case "fourteen" -> 14d;
            case "fifteen" -> 15d;
            case "sixteen" -> 16d;
            case "seventeen" -> 17d;
            case "eighteen" -> 18d;
            case "nineteen" -> 19d;
            case "twenty" -> 20d;
            case "thirty" -> 30d;
            case "forty" -> 40d;
            case "fifty" -> 50d;
            default -> null;
        };
    }

    private static boolean containsNumberWord(String value) {
        return containsAny(value, "one", "two", "three", "four", "five", "six", "seven", "eight",
                "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
                "seventeen", "eighteen", "nineteen", "twenty");
    }

    private static boolean areNaturalUnitSynonyms(String requestedUnit, String productUnit) {
        return ("boxes".equals(requestedUnit) && "cartons".equals(productUnit))
                || ("cartons".equals(requestedUnit) && "boxes".equals(productUnit));
    }

    private static boolean productMatches(String normalized, String productName) {
        String name = normalize(productName);
        if (normalized.contains(name)) {
            return true;
        }
        if (name.endsWith("s") && normalized.contains(name.substring(0, name.length() - 1))) {
            return true;
        }
        return !name.endsWith("s") && normalized.contains(name + "s");
    }

    private static VoiceCommandResponse invalid(String message, String transcript, String intent, String clarification) {
        return new VoiceCommandResponse(false, message, null, null, null, null, null, transcript, intent, clarification);
    }

    private static String normalize(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> alias : TELUGU_ALIASES.entrySet()) {
            normalized = normalized.replace(alias.getKey(), " " + alias.getValue() + " ");
        }
        return normalized
                .replaceAll("[.,!?]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private static String formatQuantity(double quantity) {
        return quantity == (long) quantity ? String.valueOf((long) quantity) : String.valueOf(quantity);
    }

    private static Map<String, String> createUnitAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("piece", TradeUnit.PIECES.getValue());
        aliases.put("pieces", TradeUnit.PIECES.getValue());
        aliases.put("pcs", TradeUnit.PIECES.getValue());
        aliases.put("kg", TradeUnit.KG.getValue());
        aliases.put("kilo", TradeUnit.KG.getValue());
        aliases.put("kilos", TradeUnit.KG.getValue());
        aliases.put("bag", TradeUnit.BAGS.getValue());
        aliases.put("bags", TradeUnit.BAGS.getValue());
        aliases.put("carton", TradeUnit.CARTONS.getValue());
        aliases.put("cartons", TradeUnit.CARTONS.getValue());
        aliases.put("box", TradeUnit.BOXES.getValue());
        aliases.put("boxes", TradeUnit.BOXES.getValue());
        aliases.put("dozen", TradeUnit.DOZENS.getValue());
        aliases.put("dozens", TradeUnit.DOZENS.getValue());
        aliases.put("litre", TradeUnit.LITRES.getValue());
        aliases.put("litres", TradeUnit.LITRES.getValue());
        aliases.put("liter", TradeUnit.LITRES.getValue());
        aliases.put("liters", TradeUnit.LITRES.getValue());
        aliases.put("packet", TradeUnit.PACKETS.getValue());
        aliases.put("packets", TradeUnit.PACKETS.getValue());
        return aliases;
    }

    private static Map<String, String> createTeluguAliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("బ్యాగ్స్", "bags");
        aliases.put("బ్యాగ్", "bag");
        aliases.put("ప్యాకెట్లు", "packets");
        aliases.put("ప్యాకెట్", "packet");
        aliases.put("కిలోలు", "kg");
        aliases.put("కిలో", "kg");
        aliases.put("పీసులు", "pieces");
        aliases.put("పీసు", "piece");
        aliases.put("బాక్సులు", "boxes");
        aliases.put("బాక్స్", "box");
        aliases.put("కార్టన్లు", "cartons");
        aliases.put("కార్టన్", "carton");
        aliases.put("డజన్లు", "dozens");
        aliases.put("డజను", "dozen");
        aliases.put("లీటర్లు", "litres");
        aliases.put("లీటర్", "litre");
        aliases.put("యాడ్", "add");
        aliases.put("చేయి", "cheyyi");
        aliases.put("చేయండి", "cheyyi");
        aliases.put("చేర్చు", "add");
        aliases.put("పెట్టు", "add");
        aliases.put("తీసేయి", "remove");
        aliases.put("తీసేయండి", "remove");
        aliases.put("తీసుకో", "remove");
        aliases.put("రైస్", "rice");
        aliases.put("రైస", "rice");
        aliases.put("సాల్ట్", "salt");
        aliases.put("ఆయిల్", "oil");
        aliases.put("షుగర్", "sugar");
        aliases.put("ఫ్లోర్", "flour");
        aliases.put("టీ", "tea");
        aliases.put("బిస్కెట్లు", "biscuits");
        aliases.put("డిటర్జెంట్", "detergent");
        return aliases;
    }

    private record QuantityAndUnit(Double quantity, String unit) {
    }
}
