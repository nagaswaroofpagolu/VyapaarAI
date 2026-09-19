package com.vyapaarai.entity;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum TradeUnit {
    PIECES("pieces"),
    KG("kg"),
    BAGS("bags"),
    CARTONS("cartons"),
    BOXES("boxes"),
    DOZENS("dozens"),
    LITRES("litres"),
    PACKETS("packets");

    private final String value;

    TradeUnit(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    private static final Set<String> VALID_UNITS = Arrays.stream(values())
            .map(TradeUnit::getValue)
            .collect(Collectors.toSet());

    public static boolean isValid(String unit) {
        if (unit == null) {
            return false;
        }
        return VALID_UNITS.contains(unit.trim().toLowerCase());
    }

    public static String normalize(String unit) {
        if (unit == null) {
            return null;
        }
        return unit.trim().toLowerCase();
    }

    public static Set<String> getValidUnits() {
        return VALID_UNITS;
    }
}
