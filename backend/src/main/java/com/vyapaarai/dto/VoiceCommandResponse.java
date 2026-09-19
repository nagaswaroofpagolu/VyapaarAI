package com.vyapaarai.dto;

public class VoiceCommandResponse {

    private boolean valid;
    private String message;
    private String action;
    private Long productId;
    private String productName;
    private Double quantity;
    private String unit;
    private String transcript;
    private String intent;
    private String clarification;
    private String category;
    private Double price;
    private Double threshold;

    public VoiceCommandResponse() {
    }

    public VoiceCommandResponse(boolean valid, String message, String action,
                                Long productId, String productName, Double quantity,
                                String unit, String transcript) {
        this.valid = valid;
        this.message = message;
        this.action = action;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unit = unit;
        this.transcript = transcript;
    }

    public VoiceCommandResponse(boolean valid, String message, String action,
                                Long productId, String productName, Double quantity,
                                String unit, String transcript, String intent,
                                String clarification) {
        this(valid, message, action, productId, productName, quantity, unit, transcript);
        this.intent = intent;
        this.clarification = clarification;
    }

    public static VoiceCommandResponse invalid(String message, String transcript) {
        return new VoiceCommandResponse(false, message, null, null, null, null, null, transcript);
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getClarification() {
        return clarification;
    }

    public void setClarification(String clarification) {
        this.clarification = clarification;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }
}
