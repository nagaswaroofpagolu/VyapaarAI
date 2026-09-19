package com.vyapaarai.exception;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(double available, String unit) {
        super(String.format("Insufficient stock. Available: %s %s.", formatQuantity(available), unit));
    }

    private static String formatQuantity(double qty) {
        if (qty == (long) qty) {
            return String.valueOf((long) qty);
        }
        return String.valueOf(qty);
    }
}
