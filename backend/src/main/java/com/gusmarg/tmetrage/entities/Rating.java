package com.gusmarg.tmetrage.entities;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.gusmarg.tmetrage.entities.enums.Platform;
import com.gusmarg.tmetrage.entities.pk.RatingPK;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "tb_rating")
public class Rating {

	@EmbeddedId
	private RatingPK id;
	@Column(nullable = false)
	private Double score;
	private LocalDate createdAt;
	@Enumerated(EnumType.STRING)
	private Platform platform;

	public void setMovie(Movie movie) {
		id.setMovie(movie);
	}

	public Movie getMovie() {
		return id.getMovie();
	}

	public void setUser(User user) {
		id.setUser(user);
	}

	public User getUser() {
		return id.getUser();
	}

	@PrePersist
	public void setCreationDate() {
		createdAt = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
	}
}
