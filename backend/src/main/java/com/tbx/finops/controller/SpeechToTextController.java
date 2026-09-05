package com.tbx.finops.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SpeechToTextController {

    private static final Logger log = LoggerFactory.getLogger(SpeechToTextController.class);

    private final String apiKey;
    private final String sttUrl;
    private final String sttModel;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public SpeechToTextController(
        @Value("${app.sarvam.api-key:}") String apiKey,
        @Value("${app.sarvam.stt-url:https://api.sarvam.ai/speech-to-text}") String sttUrl,
        @Value("${app.sarvam.stt-model:saaras:v3}") String sttModel,
        ObjectMapper objectMapper
    ) {
        String envKey = System.getenv("SARVAM_API_KEY");
        this.apiKey = (apiKey != null && !apiKey.isBlank())
            ? apiKey.trim()
            : (envKey != null ? envKey.trim() : "");
        this.sttUrl = sttUrl;
        this.sttModel = sttModel;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        String masked = this.apiKey.isBlank()
            ? "(blank)"
            : this.apiKey.substring(0, Math.min(6, this.apiKey.length())) + "***";
        log.info("[SPEECH-TO-TEXT] Constructed with apiKey='{}' sttUrl='{}' sttModel='{}'", masked, this.sttUrl, this.sttModel);
    }

    @PostMapping(value = "/speech-to-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> transcribe(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "model", required = false) String model,
        @RequestParam(value = "language_code", required = false) String languageCode
    ) {
        if (this.apiKey.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Sarvam API key is not configured. Please set SARVAM_API_KEY in your .env file."));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No audio file was provided."));
        }

        String requestedModel = (model != null && !model.isBlank()) ? model : sttModel;
        String requestedLanguage = (languageCode != null && !languageCode.isBlank()) ? languageCode : "en-IN";

        try {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("model", requestedModel);
            form.add("mode", "transcribe");
            form.add("language_code", requestedLanguage);

            byte[] audioBytes = file.getBytes();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "recording.webm";
            form.add("file", new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            });

            log.info("[SPEECH-TO-TEXT] Transcribing {} bytes via Sarvam model '{}'", audioBytes.length, requestedModel);

            ResponseEntity<JsonNode> response = restClient.post()
                .uri(sttUrl)
                .header("api-subscription-key", apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .toEntity(JsonNode.class);

            JsonNode body = response.getBody() != null ? response.getBody() : objectMapper.createObjectNode();
            return ResponseEntity.ok(Map.of(
                "transcript", body.path("transcript").asText(""),
                "language_code", body.path("language_code").asText(""),
                "model", requestedModel));
        } catch (RestClientResponseException e) {
            log.error("[SPEECH-TO-TEXT] Sarvam API error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("message", "Sarvam speech-to-text error: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            log.error("[SPEECH-TO-TEXT] Failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Speech-to-text failed: " + e.getMessage()));
        }
    }
}