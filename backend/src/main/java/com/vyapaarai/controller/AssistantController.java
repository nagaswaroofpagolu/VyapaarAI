package com.vyapaarai.controller;

import com.vyapaarai.dto.AssistantAnswerResponse;
import com.vyapaarai.dto.AssistantQuestionRequest;
import com.vyapaarai.dto.VoiceCommandRequest;
import com.vyapaarai.dto.VoiceCommandResponse;
import com.vyapaarai.service.AssistantService;
import com.vyapaarai.service.VoiceCommandService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final VoiceCommandService voiceCommandService;
    private final AssistantService assistantService;

    public AssistantController(VoiceCommandService voiceCommandService, AssistantService assistantService) {
        this.voiceCommandService = voiceCommandService;
        this.assistantService = assistantService;
    }

    @PostMapping("/interpret")
    public ResponseEntity<VoiceCommandResponse> interpret(@RequestBody VoiceCommandRequest request) {
        return ResponseEntity.ok(voiceCommandService.interpret(request));
    }

    @PostMapping("/ask")
    public ResponseEntity<AssistantAnswerResponse> ask(@RequestBody AssistantQuestionRequest request) {
        return ResponseEntity.ok(assistantService.answer(request));
    }
}
