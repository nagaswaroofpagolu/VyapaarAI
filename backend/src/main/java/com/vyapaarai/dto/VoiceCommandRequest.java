package com.vyapaarai.dto;

public class VoiceCommandRequest {

    private String transcript;
    private String language;

    public VoiceCommandRequest() {
    }

    public VoiceCommandRequest(String transcript, String language) {
        this.transcript = transcript;
        this.language = language;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
