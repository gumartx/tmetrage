import { getImageUrl } from "@/lib/files";
import { useState, useEffect, useCallback } from "react";
import { getGenreColor } from "@/lib/genreColors";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Film,
  Users,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  Loader2,
  List,
  Heart,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { getPosterUrl } from "@/lib/tmdb";
import { getMovieDetails } from "@/lib/tmdb";
import { toast } from "sonner";
import { getUserProfile, toggleFollow, UserProfile as UserProfileType } from "@/lib/profile";
import { getRecentComments, type Comment } from "@/lib/comments";
import { getRecentRatings, type RatingResponse } from "@/lib/ratings";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [recentRatings, setRecentRatings] = useState<RatingResponse[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [ratingSearch, setRatingSearch] = useState("");
  const loadProfile = useCallback(async () => {
    if (!username) return;
    try {
      const data = await getUserProfile(username);
      setProfile(data);
      setIsFollowing(data.isFollowing);
      if (data.topGenres?.length) {
        setTopGenres(data.topGenres);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!username) return;

    getRecentRatings(username)
      .then(setRecentRatings)
      .catch(() => setRecentRatings([]));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    getRecentComments(username)
      .then(setRecentComments)
      .catch(() => setRecentComments([]));
  }, [username]);

  const handleFollow = async () => {
    if (!username || !profile) return;

    try {
      await toggleFollow(username);

      setIsFollowing((prev) => {
        const newValue = !prev;

        setProfile((old) =>
          old
            ? {
              ...old,
              followers: newValue ? old.followers + 1 : old.followers - 1,
            }
            : old,
        );

        return newValue;
      });
    } catch (err) {
      toast.error(err.message || "Erro ao seguir/deixar de seguir");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Perfil não encontrado.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const displayUsername = profile.profileName.startsWith("@")
    ? profile.profileName
    : `@${profile.profileName}`;

  const filteredRatings = recentRatings.filter((r) =>
    r.movieTitle.toLowerCase().includes(ratingSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden bg-secondary sm:h-52 md:h-56">
        {profile.cover && (
          <img
            src={getImageUrl(profile.cover)}
            alt="Capa"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="container relative px-4 sm:px-6 lg:px-8">
        {/* Avatar + Info */}
        <div className="relative -mt-12 mb-4 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-background shadow-lg sm:h-32 sm:w-32">
            {profile.avatar ? (
              <AvatarImage src={getImageUrl(profile.avatar)} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground font-display text-2xl sm:text-3xl">
                {profile.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="w-full min-w-0 pb-2 sm:flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {profile.name}
                </h1>
                <p className="break-words text-sm text-muted-foreground">{displayUsername}</p>
              </div>
              <Button
                variant={isFollowing ? "secondary" : "default"}
                size="sm"
                onClick={handleFollow}
                className="w-full gap-2 sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            </div>
          </div>
        </div>

        <p className="mb-6 max-w-xl break-words text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>

        {/* Followers / Following */}
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{profile.followers}</span>
            <span className="text-muted-foreground">seguidores</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{profile.following}</span>
            <span className="text-muted-foreground">seguindo</span>
          </div>
        </div>

        {/* Favorite Movies */}
        {profile.favoriteMovies && profile.favoriteMovies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Heart className="h-5 w-5 text-primary" />
              Filmes favoritos
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
              {profile.favoriteMovies.map((movie) => {
                const poster = getPosterUrl(movie.poster_path);
                return (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group relative block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden">
                      {poster ? (
                        <img
                          src={poster}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Film className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Title — sempre visível em mobile, no hover em desktop */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white sm:text-xs">
                        {movie.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Link to={`/usuario/${profile.profileName}/filmes-avaliados`}>
            <Card className="h-full cursor-pointer border-border bg-card transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <Film className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{profile.totalRatings}</span>
                <span className="text-xs leading-tight text-muted-foreground">
                  Filmes avaliados
                </span>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full border-border bg-card">
            <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
              <Star className="h-6 w-6 text-star mb-2" />
              <span className="text-2xl font-bold text-foreground">
                {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "—"}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">Nota média</span>
            </CardContent>
          </Card>
          <Link to={`/usuario/${profile.profileName}/listas`}>
            <Card className="h-full cursor-pointer border-border bg-card transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <List className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">
                  {profile.totalLists ?? 0}
                </span>
                <span className="text-xs leading-tight text-muted-foreground">Listas criadas</span>
              </CardContent>
            </Card>
          </Link>

          <Link to={`/usuario/${profile.profileName}/comentarios`}>
            <Card className="h-full cursor-pointer border-border bg-card transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <MessageCircle className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{profile.totalComments}</span>
                <span className="text-xs leading-tight text-muted-foreground">Comentários</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Favorite Genres */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Gêneros Favoritos
          </h2>
          {topGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topGenres.map((g) => {
                const colors = getGenreColor(g.name);
                return (
                  <Link
                    key={g.name}
                    to={`/usuario/${username}/filmes-avaliados?genre=${encodeURIComponent(g.name)}`}
                    className="max-w-full break-words rounded-full px-3 py-1.5 text-sm font-medium transition-transform hover:scale-105 hover:opacity-90 sm:px-4"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {g.name} <span style={{ color: colors.text, opacity: 0.75 }}>({g.count})</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum gênero favorito ainda.</p>
          )}
        </div>

        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          {/* Avaliações */}
          <Collapsible open={ratingsOpen} onOpenChange={setRatingsOpen} className="min-w-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent">
              <h2 className="min-w-0 break-words font-display text-base font-semibold text-foreground sm:text-lg">
                Avaliações Recentes
              </h2>
              {ratingsOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {filteredRatings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum filme encontrado.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4">
                  {filteredRatings.map((r) => (
                    <Link
                      key={r.movieId}
                      to={`/movie/${r.movieId}`}
                      className="group min-w-0 overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg"
                    >
                      <div className="aspect-[2/3] overflow-hidden">
                        {getPosterUrl(r.posterPath) ? (
                          <img
                            src={getPosterUrl(r.posterPath)!}
                            alt={r.movieTitle}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Film className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="line-clamp-2 min-h-8 break-words text-xs font-semibold leading-tight text-card-foreground">
                          {r.movieTitle}
                        </h3>
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-star text-star" />
                          <span className="text-xs font-medium text-foreground">{r.rating}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Comentários */}
          <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen} className="min-w-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent">
              <h2 className="min-w-0 break-words font-display text-base font-semibold text-foreground sm:text-lg">
                Comentários Recentes
              </h2>
              {reviewsOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {recentComments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário ainda.
                </p>
              ) : (
                recentComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <Link to={`/movie/${comment.movieId}`} className="shrink-0">
                        {comment.posterPath && getPosterUrl(comment.posterPath, "w185") ? (
                          <img
                            src={getPosterUrl(comment.posterPath, "w185")!}
                            alt={comment.movieTitle ?? ""}
                            className="h-16 w-12 rounded object-cover sm:h-20 sm:w-14"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-16 w-12 items-center justify-center rounded bg-muted sm:h-20 sm:w-14">
                            <Film className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        {comment.movieTitle && (
                          <Link to={`/movie/${comment.movieId}`} className="hover:underline">
                            <h3 className="line-clamp-2 break-words text-xs font-semibold leading-tight text-card-foreground sm:text-sm">
                              {comment.movieTitle}
                            </h3>
                          </Link>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="mt-1 break-words text-xs leading-relaxed text-foreground/80 sm:text-sm">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
