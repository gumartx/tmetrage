package com.gusmarg.tmetrage.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.gusmarg.tmetrage.entities.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserDetailsDTO extends UserDTO {

	private String email;
	private Integer totalLists;
	private List<TopGenreDTO> topGenres;
	private Boolean isFollowing;
	private List<MovieDTO> favoriteMovies;

	public UserDetailsDTO(User entity, Double avgScore) {
		super(entity, avgScore);
		this.email = entity.getEmail();
		this.totalLists = entity.getAmountLists();
		this.topGenres = new ArrayList<>();
		
		this.favoriteMovies = entity.getFavoriteMovies().stream()
			    .map(m -> new MovieDTO(m))
			    .toList();
		
		this.topGenres = entity.getRatings().stream()
		        .flatMap(r -> r.getMovie().getGenres().stream())
		        .collect(Collectors.groupingBy(g -> g.getName(), Collectors.counting()))
		        .entrySet().stream()
		        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
		        .limit(5)
		        .map(e -> new TopGenreDTO(e.getKey(), e.getValue().intValue()))
		        .toList();
	}

	public UserDetailsDTO(User entity) {
		super(entity);
	}

}
