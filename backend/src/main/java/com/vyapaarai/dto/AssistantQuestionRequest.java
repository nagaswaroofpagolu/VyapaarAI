package com.vyapaarai.dto;

public class AssistantQuestionRequest {

    private String question;
    private String language;
    private String contextProductName;

    public AssistantQuestionRequest() {
    }

    public AssistantQuestionRequest(String question, String language) {
        this.question = question;
        this.language = language;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getContextProductName() {
        return contextProductName;
    }

    public void setContextProductName(String contextProductName) {
        this.contextProductName = contextProductName;
    }
}
