package com.gusmarg.tmetrage.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.gusmarg.tmetrage.entities.Movie;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class MovieDTO {

    private Long id;

    @JsonProperty("title")
    private String movieTitle;

    @JsonProperty("poster_path")
    private String posterPath;

    @JsonProperty("genres")
    private List<GenreDTO> genres;

    public MovieDTO(Movie entity) {
        this.id = entity.getId();
        this.movieTitle = entity.getTitle();
        this.posterPath = entity.getPosterPath();
        this.genres = entity.getGenres()
                .stream()
                .map(g -> new GenreDTO(g))
                .toList();
    }
}
