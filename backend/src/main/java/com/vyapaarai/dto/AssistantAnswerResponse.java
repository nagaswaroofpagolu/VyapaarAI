package com.vyapaarai.dto;

import com.vyapaarai.entity.Product;

import java.util.List;

public class AssistantAnswerResponse {

    private String answer;
    private String intent;
    private List<Product> products;
    private List<Product> reorderRecommendations;
    private String clarification;

    public AssistantAnswerResponse() {
    }

    public AssistantAnswerResponse(String answer, String intent, List<Product> products,
                                   List<Product> reorderRecommendations) {
        this.answer = answer;
        this.intent = intent;
        this.products = products;
        this.reorderRecommendations = reorderRecommendations;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public List<Product> getProducts() {
        return products;
    }

    public void setProducts(List<Product> products) {
        this.products = products;
    }

    public List<Product> getReorderRecommendations() {
        return reorderRecommendations;
    }

    public void setReorderRecommendations(List<Product> reorderRecommendations) {
        this.reorderRecommendations = reorderRecommendations;
    }

    public String getClarification() {
        return clarification;
    }

    public void setClarification(String clarification) {
        this.clarification = clarification;
    }
}
