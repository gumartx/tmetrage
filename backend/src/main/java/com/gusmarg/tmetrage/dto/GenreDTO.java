package com.gusmarg.tmetrage.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.gusmarg.tmetrage.entities.Genre;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GenreDTO {

	private Long id;
	private String name;
	
	public GenreDTO(Genre entity) {
		id = entity.getId();
		name = entity.getName();
	}
}
