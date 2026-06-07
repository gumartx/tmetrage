package com.gusmarg.tmetrage.services;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gusmarg.tmetrage.components.TMDBSaveData;
import com.gusmarg.tmetrage.dto.RatedMovieDTO;
import com.gusmarg.tmetrage.dto.RatingFilterDTO;
import com.gusmarg.tmetrage.dto.RatingMovieDTO;
import com.gusmarg.tmetrage.dto.RatingResponseDTO;
import com.gusmarg.tmetrage.dto.RatingUpdateDTO;
import com.gusmarg.tmetrage.entities.Movie;
import com.gusmarg.tmetrage.entities.MovieList;
import com.gusmarg.tmetrage.entities.Rating;
import com.gusmarg.tmetrage.entities.User;
import com.gusmarg.tmetrage.entities.pk.RatingPK;
import com.gusmarg.tmetrage.repositories.GenreRepository;
import com.gusmarg.tmetrage.repositories.MovieListRepository;
import com.gusmarg.tmetrage.repositories.MovieRepository;
import com.gusmarg.tmetrage.repositories.RatingRepository;
import com.gusmarg.tmetrage.repositories.UserRepository;
import com.gusmarg.tmetrage.services.utils.TMDBService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Service
public class RatingService {

	private final AuthService authService;
	private final UserRepository userRepository;
	private final RatingRepository ratingRepository;
	private final MovieListRepository movieListRepository;
	private final MovieRepository movieRepository;
	private final GenreRepository genreRepository;
	private final TMDBService tmdbService;

	@Transactional(readOnly = true)
	public RatingResponseDTO findMovieUserRating(Long movieId) {

		User user = authService.getAuthenticatedUser();

		Movie movie = movieRepository.findById(movieId).orElseGet(() -> {
			return TMDBSaveData.saveMovieFromTMDB(movieId, tmdbService, movieRepository, genreRepository);
		});

		log.info("Avaliação de usuário '{}' no filme '{}'", user.getProfileName(), movie.getTitle());

		return ratingRepository.findByIdUserIdAndIdMovieId(user.getId(), movie.getId()).map(RatingResponseDTO::new)
				.orElse(null);
	}

	@Transactional(readOnly = true)
	public Page<RatingResponseDTO> findUserRatings(RatingFilterDTO filter, Pageable pageable) {

		User user = authService.getAuthenticatedUser();

		pageable = translateSort(pageable);
		
		LocalDate startDate = null;
		LocalDate endDate = null;

		if (filter.getPeriod() != null) {

			LocalDate now = LocalDate.now();

			switch (filter.getPeriod()) {

			case LAST_WEEK -> startDate = now.minusWeeks(1);

			case LAST_MONTH -> startDate = now.minusMonths(1);

			case LAST_3_MONTHS -> startDate = now.minusMonths(3);

			case LAST_YEAR -> startDate = now.minusYears(1);

			case CUSTOM -> {
				startDate = filter.getStartDate();
				endDate = filter.getEndDate();
			}
			}

			if (endDate == null) {
				endDate = now;
			}
		}

		Page<Rating> ratings = ratingRepository.findByFilters(user.getId(), filter.getTitle(), filter.getPlatform(), filter.getScore(), filter.getGenreId(),
				startDate, endDate, pageable);

		log.info("Encontrado {} avaliação(ões) de '{}'", ratings.getTotalElements(), user.getProfileName());

		return ratings.map(RatingResponseDTO::new);
	}

	@Transactional(readOnly = true)
	public Page<RatingResponseDTO> findUserRatingsByProfileName(String profileName, RatingFilterDTO filter, Pageable pageable) {

		User user = userRepository.findByProfileName(profileName);

		pageable = translateSort(pageable);
		
		LocalDate startDate = null;
		LocalDate endDate = null;

		if (filter.getPeriod() != null) {

			LocalDate now = LocalDate.now();

			switch (filter.getPeriod()) {

			case LAST_WEEK -> startDate = now.minusWeeks(1);

			case LAST_MONTH -> startDate = now.minusMonths(1);

			case LAST_3_MONTHS -> startDate = now.minusMonths(3);

			case LAST_YEAR -> startDate = now.minusYears(1);

			case CUSTOM -> {
				startDate = filter.getStartDate();
				endDate = filter.getEndDate();
			}
			}

			if (endDate == null) {
				endDate = now;
			}
		}

		Page<Rating> ratings = ratingRepository.findByFilters(user.getId(), filter.getTitle(), filter.getPlatform(), filter.getScore(), filter.getGenreId(),
				startDate, endDate, pageable);

		log.info("Encontrado {} avaliação(ões) de '{}'", ratings.getTotalElements(), user.getProfileName());

		return ratings.map(RatingResponseDTO::new);
	}

	@Transactional
	public RatingResponseDTO rateMovie(RatingMovieDTO dto) {

		User user = authService.getAuthenticatedUser();

		Movie movie = movieRepository.findById(dto.getMovieId()).orElseGet(() -> {
			return TMDBSaveData.saveMovieFromTMDB(dto.getMovieId(), tmdbService, movieRepository, genreRepository);
		});

		RatingPK id = new RatingPK(user, movie);

		Rating rating = new Rating();
		rating.setId(id);
		rating.setScore(dto.getRating());
		rating.setPlatform(dto.getPlatform());

		rating = ratingRepository.save(rating);

		log.info("Usuário '{}' avaliou filme '{}' com nota {}", user.getProfileName(), movie.getTitle(),
				dto.getRating());

		return new RatingResponseDTO(rating);
	}

	@Transactional
	public RatingResponseDTO updateRating(Long movieId, RatingUpdateDTO dto) {

		User user = authService.getAuthenticatedUser();

		Movie movie = movieRepository.findById(movieId).orElseGet(() -> {
			return TMDBSaveData.saveMovieFromTMDB(movieId, tmdbService, movieRepository, genreRepository);
		});

		RatingPK id = new RatingPK(user, movie);

		Rating rating = ratingRepository.getReferenceById(id);
		rating.setScore(dto.getRating());
		rating.setPlatform(dto.getPlatform());

		rating = ratingRepository.save(rating);

		log.info("Usuário '{}' atualizou dados do filme '{}'", user.getProfileName(), movie.getTitle());

		return new RatingResponseDTO(rating);
	}

	@Transactional
	public void removeRating(Long movieId) {

		User user = authService.getAuthenticatedUser();

		RatingPK id = new RatingPK();

		Movie movie = movieRepository.findById(movieId).orElseGet(() -> {
			return TMDBSaveData.saveMovieFromTMDB(movieId, tmdbService, movieRepository, genreRepository);
		});

		id.setUser(user);
		id.setMovie(movie);

		if (!ratingRepository.existsById(id)) {
			throw new RuntimeException("Usuário não tem avaliação nesse filme");
		}

		ratingRepository.deleteById(id);

		log.info("Usuário '{}' retirou avaliação do filme '{}'", user.getProfileName(), movie.getTitle());
	}

	@Transactional(readOnly = true)
	public List<RatedMovieDTO> getRatedMovies(Long listId) {

		User user = authService.getAuthenticatedUser();

		MovieList list = movieListRepository.findById(listId)
				.orElseThrow(() -> new RuntimeException("Lista não encontrada"));

		Set<Movie> movies = list.getMovies();

		List<Long> movieIds = movies.stream().map(Movie::getId).toList();

		if (movieIds == null || movieIds.isEmpty()) {
			return List.of();
		}

		List<Rating> ratings = ratingRepository.findByIdUserIdAndIdMovieIdIn(user.getId(), movieIds);

		Map<Long, Rating> ratingMap = ratings.stream().collect(Collectors.toMap(r -> r.getMovie().getId(), r -> r));

		log.info("Avaliação(ões) dos filmes presentes na lista '{}'", list.getName());

		return movies.stream().map(movie -> new RatedMovieDTO(movie, ratingMap.get(movie.getId()))).toList();
	}

	@Transactional(readOnly = true)
	public List<RatingResponseDTO> getRecentRatings(String profileName) {
		User user = userRepository.findByProfileName(profileName);
		
		List<Rating> ratings = ratingRepository.findTop8ByIdUserOrderByCreatedAtDesc(user);

		log.info("Avaliação(ões) recente(s) de '{}'", user.getProfileName());

		return ratings.stream().map(rating -> new RatingResponseDTO(rating)).toList();
	}

	private Pageable translateSort(Pageable pageable) {

	    if (pageable.getSort().isUnsorted()) {
	        return pageable;
	    }

	    List<Sort.Order> orders = new ArrayList<>();

	    for (Sort.Order order : pageable.getSort()) {

	        String property = order.getProperty();

	        if (property.equals("movieTitle")) {
	            property = "id.movie.title";
	        }

	        orders.add(new Sort.Order(order.getDirection(), property));
	    }

	    return PageRequest.of(
	            pageable.getPageNumber(),
	            pageable.getPageSize(),
	            Sort.by(orders)
	    );
	}
	
}
