import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Film, BarChart3, Star, Filter } from "lucide-react";
import { getPublicListByUser, type MovieList } from "@/lib/movieLists";
import { getMovieDetails, getPosterUrl, getGenres } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/files";

const UserListDetail = () => {
  const { username, id } = useParams<{ username: string; id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<MovieList | undefined>();
  const [movieGenres, setMovieGenres] = useState<Record<number, number[]>>({});
  const [showChart, setShowChart] = useState(false);
  const [genreFilter, setGenreFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    if (!username || !id) return;
    const load = async () => {
      try {
        const data = await getPublicListByUser(username, id);
        setList(data);
      } catch {
        setList(undefined);
      }
    };
    load();
  }, [username, id]);

  useEffect(() => {
    if (!list?.movies) return;
    async function fetchGenres() {
      const map: Record<number, number[]> = {};
      await Promise.all(
        list!.movies.map(async (movie) => {
          try {
            const data = await getMovieDetails(movie.id);
            map[movie.id] = data.genres?.map((g: { id: number; name: string }) => g.id) || [];
          } catch {
            /* skip */
          }
        }),
      );
      setMovieGenres(map);
    }
    fetchGenres();
  }, [list]);

  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const CHART_COLORS = [
    "hsl(199, 89%, 48%)",
    "hsl(45, 93%, 58%)",
    "hsl(142, 71%, 45%)",
    "hsl(280, 65%, 60%)",
    "hsl(0, 84%, 60%)",
    "hsl(25, 95%, 53%)",
    "hsl(330, 80%, 55%)",
    "hsl(180, 60%, 45%)",
    "hsl(210, 70%, 55%)",
    "hsl(60, 70%, 50%)",
  ];

  const allGenres = useMemo(() => {
    if (!list || !genres) return new Map<number, string>();
    const map = new Map<number, string>();
    list.movies.forEach((movie) => {
      const gIds = movieGenres[movie.id] || [];
      gIds.forEach((gid) => {
        const g = genres.find((g) => g.id === gid);
        if (g) map.set(gid, g.name);
      });
    });
    return map;
  }, [list, genres, movieGenres]);

  const genreChartData = useMemo(() => {
    if (!list || !genres) return [];
    const counts: Record<number, number> = {};
    list.movies.forEach((movie) => {
      const gIds = movieGenres[movie.id] || [];
      gIds.forEach((gid) => {
        counts[gid] = (counts[gid] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([id, count]) => ({
        name: genres.find((g) => g.id === Number(id))?.name || `ID ${id}`,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [list, genres, movieGenres]);

  const genreMoviesMap = useMemo(() => {
    if (!list || !genres) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    list.movies.forEach((movie) => {
      (movieGenres[movie.id] || []).forEach((gid) => {
        const genreName = genres.find((g) => g.id === gid)?.name;
        if (!genreName) return;
        if (!map.has(genreName)) map.set(genreName, []);
        map.get(genreName)!.push(movie.title);
      });
    });
    return map;
  }, [list, genres, movieGenres]);

  const totalMovies = list?.movies.length ?? 0;
  const totalGenres = genreChartData.length;

  const filteredMovies = useMemo(() => {
    if (!list) return [];
    return list.movies.filter((movie) => {
      if (genreFilter !== "all") {
        const gIds = movieGenres[movie.id] || [];
        if (!gIds.includes(Number(genreFilter))) return false;
      }
      if (ratingFilter !== "all") {
        if (ratingFilter === "none") {
          if (movie.rating != null && movie.rating > 0) return false;
        } else {
          if (movie.rating !== Number(ratingFilter)) return false;
        }
      }
      return true;
    });
  }, [list, movieGenres, genreFilter, ratingFilter]);

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Lista não encontrada ou não é pública.</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate(`/usuario/${username}/listas`)}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/usuario/${username}/listas`)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {list.ownerUser && (
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {list.ownerUser.avatar ? (
                    <img
                      src={getImageUrl(list.ownerUser.avatar)}
                      alt={list.ownerUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {list.ownerUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <Link
                  to={`/usuario/${username}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {list.ownerUser.profileName}
                </Link>
              </div>
            )}

            <h1 className="break-words font-display text-2xl font-bold text-foreground sm:text-3xl">
              {list.name}
            </h1>
            {list.description && (
              <p className="mt-1 max-w-3xl break-words text-sm text-muted-foreground">
                {list.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {list.movies.length} {list.movies.length === 1 ? "filme" : "filmes"}
              {filteredMovies.length !== list.movies.length &&
                ` (${filteredMovies.length} exibidos)`}
            </p>
          </div>

          {list.movies.length > 0 && (
            <Dialog open={showChart} onOpenChange={setShowChart}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                  <BarChart3 className="mr-1.5 h-4 w-4" />
                  Gerar Gráfico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[850px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Distribuição de Gêneros
                  </DialogTitle>
                </DialogHeader>
                {genreChartData.length > 0 ? (
                  <div className="grid gap-4 pb-2 pt-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
                    <div className="h-[320px] min-w-0 overflow-hidden rounded-lg border border-border bg-card/40 p-2 sm:h-[420px] sm:p-4 lg:h-[480px]">
                      <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                          <Pie
                            data={genreChartData}
                            cx="50%"
                            cy="45%"
                            innerRadius="42%"
                            outerRadius="68%"
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={2}
                            label={({ name, percent, x, y, textAnchor, index }) => (
                              <text
                                x={x}
                                y={y}
                                textAnchor={textAnchor}
                                dominantBaseline="central"
                                className="text-[10px] font-semibold sm:text-xs"
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              >
                                {`${name} (${(percent * 100).toFixed(0)}%)`}
                              </text>
                            )}
                            labelLine={({ points, index }) => (
                              <polyline
                                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                                fill="none"
                                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                strokeWidth={1.6}
                                strokeOpacity={0.85}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          >
                            {genreChartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            wrapperStyle={{ maxWidth: "min(260px, calc(100vw - 3rem))" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const genreName = payload[0].name as string;
                              const count = payload[0].value as number;
                              const movies = genreMoviesMap.get(genreName) || [];
                              return (
                                <div className="max-w-[min(260px,calc(100vw-3rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                                  <p className="mb-2 break-words text-sm font-semibold">
                                    {genreName} ({count} {count === 1 ? "filme" : "filmes"})
                                  </p>
                                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                                    {movies.map((title) => (
                                      <li
                                        key={title}
                                        className="break-words border-t border-border pt-1 first:border-t-0 first:pt-0"
                                      >
                                        {title}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                        <div className="rounded-lg border border-border bg-card p-3 text-center sm:p-4">
                          <p className="text-xs text-muted-foreground">Filmes na lista</p>
                          <p className="text-2xl font-bold text-foreground">{totalMovies}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-3 text-center sm:p-4">
                          <p className="text-xs text-muted-foreground">Gêneros diferentes</p>
                          <p className="text-2xl font-bold text-foreground">{totalGenres}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                          {genreChartData.map((genre, index) => (
                            <div
                              key={genre.name}
                              className="flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-sm transition-colors hover:bg-accent/60"
                            >
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                }}
                              />
                              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                {genre.name}
                              </span>
                              <span className="shrink-0 font-medium text-foreground">
                                {genre.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum dado de gênero disponível.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros: gênero + nota */}
        {list.movies.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(180px,200px))]">
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-full min-w-0">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gêneros</SelectItem>
                {Array.from(allGenres.entries())
                  .sort(([, a], [, b]) => a.localeCompare(b))
                  .map(([id, name]) => (
                    <SelectItem key={id} value={String(id)}>
                      {name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full min-w-0">
                <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Nota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as notas</SelectItem>
                <SelectItem value="none">Sem avaliação</SelectItem>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    <span className="flex items-center gap-1">
                      {Array.from({ length: n }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-star text-star" />
                      ))}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-6 border-t border-border" />

        {list.movies.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <Film className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Lista vazia</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <Filter className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Nenhum filme encontrado com os filtros selecionados.
            </p>
          </div>
        ) : (
          // ✅ Grid responsivo melhorado
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {filteredMovies.map((movie) => {
              const url = getPosterUrl(movie.poster_path);
              return (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="aspect-[2/3] overflow-hidden">
                    {url ? (
                      <img
                        src={url}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-1.5 sm:p-3">
                    <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-4 text-card-foreground sm:min-h-[2.5rem] sm:text-sm sm:leading-5">
                      {movie.title}
                    </h3>
                    {movie.rating != null && movie.rating > 0 ? (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                              s <= movie.rating!
                                ? "fill-star text-star"
                                : "fill-transparent text-star-empty"
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Sem avaliação</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserListDetail;
