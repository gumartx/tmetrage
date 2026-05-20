package com.gusmarg.tmetrage.services.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.gusmarg.tmetrage.dto.MovieDTO;

import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
public class TMDBService {

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Value("${tmdb.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public TMDBService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public MovieDTO getMovieById(Long movieId) {
        String url = apiUrl + "/movie/" + movieId + "?api_key=" + apiKey + "&language=pt-BR";
        String raw = restTemplate.getForObject(url, String.class);
        log.info("TMDB raw response: {}", raw);
        try {
            return objectMapper.readValue(raw, MovieDTO.class);
        } catch (Exception e) {
            log.error("Erro ao desserializar MovieDTO: {}", e.getMessage());
            throw new RuntimeException("Erro ao desserializar MovieDTO", e);
        }
    }
}