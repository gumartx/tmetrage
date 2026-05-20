const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  overview: string;
  release_date: string;
  genre_ids: number[];
}

export interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  overview: string;
  release_date: string;
  runtime: number | null;
  genres: Genre[];
  tagline: string;
  status: string;
  original_language: string;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string | null }[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Review {
  id: string;
  author: string;
  author_details: {
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
}

interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export async function searchMovies(query: string, page = 1): Promise<MovieResponse> {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=pt-BR`
  );
  if (!res.ok) throw new Error("Failed to search movies");
  return res.json();
}

export async function discoverMovies(page = 1, genreId?: number): Promise<MovieResponse> {
  const genreParam = genreId ? `&with_genres=${genreId}` : "";
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc&language=pt-BR${genreParam}`
  );
  if (!res.ok) throw new Error("Failed to discover movies");
  return res.json();
}

export async function getGenres(): Promise<Genre[]> {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
  if (!res.ok) throw new Error("Failed to get genres");
  const data = await res.json();
  return data.genres;
}

export async function getMovieDetails(movieId: number): Promise<MovieDetails> {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`
  );
  if (!res.ok) throw new Error("Failed to get movie details");
  return res.json();
}

export async function getMovieCredits(movieId: number): Promise<CastMember[]> {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=pt-BR`
  );
  if (!res.ok) throw new Error("Failed to get movie credits");
  const data = await res.json();
  return data.cast;
}

export async function getMovieReviews(movieId: number): Promise<Review[]> {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}/reviews?api_key=${API_KEY}&language=pt-BR`
  );
  if (!res.ok) throw new Error("Failed to get movie reviews");
  const data = await res.json();
  return data.results;
}

export function getPosterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: "w185" | "h632" = "w185") {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export async function getTrendingMovies(): Promise<Movie[]> {
  const res = await fetch(
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=pt-BR`
  );
  if (!res.ok) throw new Error("Failed to get trending movies");
  const data = await res.json();
  return data.results;
}
