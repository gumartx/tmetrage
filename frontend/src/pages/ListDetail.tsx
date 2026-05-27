import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Film,
  Search,
  BarChart3,
  Star,
  Calendar as CalendarIcon,
  Filter,
  Share2,
  User,
  Users,
  ArrowUpAZ,
  ArrowDownZA,
} from "lucide-react";
import { Tv } from "lucide-react";
import { format } from "date-fns";
import {
  getList,
  getSharedLists,
  removeMovieFromList,
  addMovieToList,
  shareList,
  unshareList,
  type MovieList,
  type MovieListItem,
  type SharedList,
  type UserMovieRating,
  getSharedListDetail,
} from "@/lib/movieLists";
import { getMovieDetails, searchMovies, getPosterUrl, getGenres } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PLATFORMS, PlatformBadge } from "@/components/UserRating";
import { getFollowing, getCurrentUserProfile } from "@/lib/profile";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getMovieRatingsList, getUserRatings, type RatingResponse } from "@/lib/ratings";
import { getImageUrl } from "@/lib/files";

const DATE_PRESETS = [
  { label: "Todos", value: "all" },
  { label: "Última semana", value: "7d" },
  { label: "Último mês", value: "30d" },
  { label: "Últimos 3 meses", value: "90d" },
  { label: "Último ano", value: "1y" },
  { label: "Personalizado", value: "custom" },
];

const parseLocalDate = (dateStr: string): Date => {
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<MovieList | undefined>();
  const [sharedList, setSharedList] = useState<SharedList | null>(null);
  const [movieGenres, setMovieGenres] = useState<Record<number, number[]>>({});
  const [movieRatings, setRatings] = useState<Record<number, RatingResponse>>({});
  const [showChart, setShowChart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSharedUsers, setShowSharedUsers] = useState(false);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [following, setFollowing] = useState<
    { name: string; profileName: string; avatar: string }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    profileName: string;
    avatar: string | null;
  } | null>(null);
  const [genreFilter, setGenreFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");
  const [showTitleSearch, setShowTitleSearch] = useState(false);

  const loadList = async () => {
    if (!id) return;
    try {
      const data = await getList(id);
      setList(data);
    } catch {
      try {
        const shared = await getSharedListDetail(id);
        setSharedList(shared);
        setList(shared.list);
      } catch {
        setList(undefined);
      }
    }
  };

  useEffect(() => {
    getCurrentUserProfile()
      .then((u) =>
        setCurrentUser({
          profileName: u.profileName,
          avatar: u.avatar ?? null,
        }),
      )
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    loadList();
  }, [id]);

  useEffect(() => {
    if (showShare) {
      getFollowing()
        .then(setFollowing)
        .catch(() => {});
    }
  }, [showShare]);

  useEffect(() => {
    if (!list?.movies) return;
    async function fetchRatings() {
      try {
        const userRatings = await getMovieRatingsList(list.id);
        const map: Record<number, RatingResponse> = {};
        userRatings.forEach((r) => {
          map[r.movieId] = r;
        });
        setRatings(map);
      } catch (err) {
        console.error("Erro ao carregar avaliações:", err);
      }
    }
    fetchRatings();
  }, [list]);

  useEffect(() => {
    if (!list?.movies) return;
    async function fetchGenres() {
      const map: Record<number, number[]> = {};
      await Promise.all(
        list!.movies.map(async (movie) => {
          try {
            const data = await getMovieDetails(movie.id);
            map[movie.id] = data.genres?.map((g: { id: number; name: string }) => g.id) || [];
          } catch (err) {
            console.error("Erro ao buscar gêneros:", movie.id, err);
          }
        }),
      );
      setMovieGenres(map);
    }
    fetchGenres();
  }, [list]);

  useEffect(() => {
    if (!list?.id) return;
    const loadShared = async () => {
      try {
        const data = await getSharedListDetail(list.id);
        setSharedList(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadShared();
  }, [list?.id]);

  const getMovieSharedRatings = (movieId: number) => {
    if (!sharedList?.ratings) return [];
    return sharedList.ratings.filter((r) => r.movieId === movieId);
  };

  const toggleUserSelection = (profileName: string) => {
    setSelectedUsers((prev) =>
      prev.includes(profileName) ? prev.filter((u) => u !== profileName) : [...prev, profileName],
    );
  };

  const sharedUsers = useMemo(() => {
    if (!sharedList?.sharedTo) return [];
    const map = new Map();
    if (sharedList.sharedBy) {
      const normalize = (p?: string | null) => p?.replace(/^@/, "").toLowerCase() ?? "";
      const isOwner =
        normalize(sharedList.sharedBy.profileName) === normalize(currentUser?.profileName);
      if (!isOwner) {
        map.set(sharedList.sharedBy.profileName, {
          profileName: sharedList.sharedBy.profileName,
          name: sharedList.sharedBy.profileName,
          avatar: sharedList.sharedBy.avatar ?? null,
        });
      }
    }
    sharedList.sharedTo.forEach((r) => {
      if (!map.has(r.profileName)) {
        map.set(r.profileName, {
          profileName: r.profileName,
          name: r.profileName,
          avatar: r.avatar ?? null,
        });
      }
    });
    return Array.from(map.values());
  }, [sharedList, currentUser]);

  const filteredFollowing = useMemo(() => {
    if (!list) return [];
    const sharedSet = new Set(sharedUsers.map((u) => u.profileName));
    const availableUsers = following.filter((u) => !sharedSet.has(u.profileName));
    if (!shareSearch.trim()) return availableUsers;
    const q = shareSearch.toLowerCase();
    return availableUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.profileName.toLowerCase().includes(q),
    );
  }, [following, shareSearch, list, sharedUsers]);

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !list) return;
    try {
      await shareList(list.id, selectedUsers);
      const updatedShared = await getSharedListDetail(list.id);
      setSharedList(updatedShared);
      setList(updatedShared.list);
      setSelectedUsers([]);
      setShareSearch("");
      setShowShare(false);
    } catch (err) {
      console.error("Erro ao compartilhar lista:", err);
    }
  };

  const handleUnshare = async (profileName: string) => {
    if (!list) return;
    try {
      await unshareList(list.id, profileName);
      const updatedSharedList = await getSharedListDetail(list.id);
      setSharedList(updatedSharedList);
      await loadList();
    } catch (err) {
      console.error("Erro ao remover usuário da lista:", err);
    }
  };

  const { data: searchResults } = useQuery({
    queryKey: ["list-search", searchTerm],
    queryFn: () => searchMovies(searchTerm, 1),
    enabled: searchTerm.length > 1,
  });

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

  const getDateRange = (): { from?: Date; to?: Date } => {
    if (datePreset === "custom") return { from: dateFrom, to: dateTo };
    if (datePreset === "all") return {};
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = new Date(todayMidnight);
    switch (datePreset) {
      case "7d":
        from.setDate(todayMidnight.getDate() - 7);
        break;
      case "30d":
        from.setDate(todayMidnight.getDate() - 30);
        break;
      case "90d":
        from.setDate(todayMidnight.getDate() - 90);
        break;
      case "1y":
        from.setFullYear(todayMidnight.getFullYear() - 1);
        break;
    }
    return { from, to: todayMidnight };
  };

  const filteredMovies = useMemo(() => {
    if (!list) return [];
    const filtered = list.movies.filter((movie) => {
      if (
        titleFilter.trim() &&
        !movie.title.toLowerCase().includes(titleFilter.trim().toLowerCase())
      ) {
        return false;
      }
      const rating = movieRatings[movie.id];
      if (genreFilter !== "all") {
        const gIds = movieGenres[movie.id] || [];
        if (!gIds.includes(Number(genreFilter))) return false;
      }
      if (platformFilter !== "all") {
        if (platformFilter === "none") {
          if (rating?.platform) return false;
        } else {
          if (rating?.platform !== platformFilter) return false;
        }
      }
      if (datePreset !== "all" && rating?.createdAt) {
        const range = getDateRange();
        const ratingDate = parseLocalDate(rating.createdAt);
        if (range.from) {
          const from = new Date(range.from);
          from.setHours(0, 0, 0, 0);
          if (ratingDate < from) return false;
        }
        if (range.to) {
          const to = new Date(range.to);
          to.setHours(23, 59, 59, 999);
          if (ratingDate > to) return false;
        }
      } else if (datePreset !== "all" && !rating?.createdAt) {
        return false;
      }
      let referenceRating: number | null | undefined = rating?.rating;
      if (userFilter !== "all") {
        const userRatingEntry = sharedList?.ratings?.find(
          (r) => r.movieId === movie.id && r.profileName === userFilter,
        );
        if (!userRatingEntry) return false;
        referenceRating = userRatingEntry.rating;
      }
      if (ratingFilter !== "all") {
        if (referenceRating == null || referenceRating !== Number(ratingFilter)) return false;
      }
      return true;
    });
    if (sortOrder === "asc") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    }
    if (sortOrder === "desc") {
      return [...filtered].sort((a, b) => b.title.localeCompare(a.title, "pt-BR"));
    }
    return filtered;
  }, [
    list,
    movieRatings,
    movieGenres,
    genreFilter,
    platformFilter,
    datePreset,
    dateFrom,
    dateTo,
    ratingFilter,
    userFilter,
    titleFilter,
    sortOrder,
  ]);

  const handleSearch = () => setSearchTerm(query);

  const handleAddMovie = async (movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    genre_ids: number[];
  }) => {
    if (!id) return;
    const item: MovieListItem = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      genre_ids: movieGenres[movie.id] || [],
    };
    await addMovieToList(id, item);
    await loadList();
  };

  const handleRemove = async (movieId: number) => {
    if (!id) return;
    await removeMovieFromList(id, movieId);
    await loadList();
  };

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Lista não encontrada.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/listas")}>
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
          onClick={() => navigate("/listas")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        {list.isShared && sharedList?.sharedBy && (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {sharedList.sharedBy.avatar ? (
                <img
                  src={getImageUrl(sharedList.sharedBy.avatar)}
                  alt={sharedList.sharedBy.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground">
                  {sharedList.sharedBy.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            {(() => {
              const normalize = (p?: string | null) =>
                p?.replace(/^@/, "").toLowerCase() ?? "";
              const isOwner =
                normalize(sharedList.sharedBy.profileName) ===
                normalize(currentUser?.profileName);
              return (
                <Link
                  to={isOwner ? "/perfil" : `/usuario/${sharedList.sharedBy.profileName}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {sharedList.sharedBy.profileName}
                </Link>
              );
            })()}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
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

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {list.movies.length > 0 && (
              <Dialog open={showChart} onOpenChange={setShowChart}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
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
            {list.owner !== false && (
              <Dialog
                open={showShare}
                onOpenChange={(v) => {
                  setShowShare(v);
                  if (!v) {
                    setShareSearch("");
                    setSelectedUsers([]);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      Compartilhar Lista
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-secondary">
                      <Search className="ml-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou usuário..."
                        value={shareSearch}
                        onChange={(e) => setShareSearch(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-2 max-h-[300px] overflow-y-auto space-y-1">
                    {filteredFollowing.length > 0 ? (
                      filteredFollowing.map((user) => (
                        <div
                          key={user.profileName}
                          onClick={() => toggleUserSelection(user.profileName)}
                          className={cn(
                            "flex items-center gap-3 rounded-md border p-2.5 cursor-pointer transition-colors",
                            selectedUsers.includes(user.profileName)
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-accent",
                          )}
                        >
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar ? (
                              <img
                                src={getImageUrl(user.avatar)}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">
                                {user.profileName.charAt(1).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.profileName}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              selectedUsers.includes(user.profileName)
                                ? "border-primary bg-primary"
                                : "border-muted-foreground",
                            )}
                          >
                            {selectedUsers.includes(user.profileName) && (
                              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {following.length === 0
                          ? "Você ainda não segue ninguém."
                          : "Nenhum usuário encontrado."}
                      </p>
                    )}
                  </div>
                  {following.length > 0 && (
                    <div className="flex justify-end pt-2">
                      <Button size="sm" disabled={selectedUsers.length === 0} onClick={handleShare}>
                        <Share2 className="mr-1.5 h-4 w-4" />
                        Compartilhar{selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ""}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
            {sharedUsers.length > 0 && (
              <Dialog open={showSharedUsers} onOpenChange={setShowSharedUsers}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" title="Ver usuários compartilhados">
                    <Users className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Compartilhada com ({sharedUsers.length})
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 max-h-[400px] overflow-y-auto space-y-2">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.profileName}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-2.5 hover:bg-accent transition-colors"
                      >
                        {user.profileName === currentUser?.profileName ? (
                          <Link
                            to={`/perfil`}
                            onClick={() => setShowSharedUsers(false)}
                            className="flex flex-1 items-center gap-3 min-w-0"
                          >
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {user.avatar ? (
                                <img
                                  src={getImageUrl(user.avatar)}
                                  alt={user.profileName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {user.profileName.charAt(1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">
                                {user.profileName}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <Link
                            to={`/usuario/${user.profileName}`}
                            onClick={() => setShowSharedUsers(false)}
                            className="flex flex-1 items-center gap-3 min-w-0"
                          >
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {user.avatar ? (
                                <img
                                  src={getImageUrl(user.avatar)}
                                  alt={user.profileName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {user.profileName.charAt(1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">
                                {user.profileName}
                              </p>
                            </div>
                          </Link>
                        )}
                        {list.owner !== false && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleUnshare(user.profileName)}
                            title="Remover usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog
              open={searchOpen}
              onOpenChange={(v) => {
                setSearchOpen(v);
                if (!v) {
                  setQuery("");
                  setSearchTerm("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Search className="mr-1.5 h-4 w-4" />
                  Adicionar Filme
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[90svh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Buscar filme para adicionar</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <div className="flex flex-1 items-center rounded-md border border-border bg-secondary min-w-0">
                    <input
                      type="text"
                      placeholder="Pesquisar filme..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                    />
                  </div>
                  <Button size="sm" onClick={handleSearch} className="w-full sm:w-auto">
                    Buscar
                  </Button>
                </div>
                {searchResults && (
                  <div className="mt-4 space-y-2 overflow-y-auto flex-1">
                    {searchResults.results.slice(0, 10).map((movie) => {
                      const alreadyAdded = list.movies.some((m) => m.id === movie.id);
                      return (
                        <div
                          key={movie.id}
                          className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-card p-2"
                        >
                          {getPosterUrl(movie.poster_path, "w185") ? (
                            <img
                              src={getPosterUrl(movie.poster_path, "w185")!}
                              alt={movie.title}
                              className="h-16 w-11 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-16 w-11 items-center justify-center rounded bg-muted shrink-0">
                              <Film className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-card-foreground">
                              {movie.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {movie.release_date?.slice(0, 4)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={alreadyAdded ? "secondary" : "default"}
                            disabled={alreadyAdded}
                            onClick={() => handleAddMovie(movie)}
                            className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                          >
                            {alreadyAdded ? "Adicionado" : "Adicionar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        {list.movies.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant={showTitleSearch ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  setShowTitleSearch((prev) => {
                    if (prev) setTitleFilter("");
                    return !prev;
                  });
                }}
                title="Buscar por título"
                className="shrink-0 transition-opacity"
              >
                <Search className="h-4 w-4" />
              </Button>

              {showTitleSearch && (
                <Input
                  autoFocus
                  placeholder="Buscar filme pelo nome..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="min-w-[180px] flex-1 basis-full transition-all sm:basis-[220px]"
                />
              )}

              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="min-w-0 flex-1 basis-[calc(50%-0.5rem)] sm:basis-[180px] sm:flex-none sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
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

              <Select
                value={platformFilter}
                onValueChange={(v) => {
                  setPlatformFilter(v);
                  if (v !== "all") setUserFilter("all");
                }}
              >
                <SelectTrigger className={cn("min-w-0 flex-1 basis-[calc(50%-0.5rem)] sm:basis-[180px] sm:flex-none sm:w-[180px] transition-opacity", userFilter !== "all" && "opacity-40")}>
                  <Tv className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as plataformas</SelectItem>
                  <SelectItem value="none">Não informado</SelectItem>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <PlatformBadge value={p.value} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="min-w-0 flex-1 basis-[calc(50%-0.5rem)] sm:basis-[160px] sm:flex-none sm:w-[160px]">
                  <Star className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Nota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as notas</SelectItem>
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

              {sharedUsers.length > 0 && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="min-w-0 flex-1 basis-[calc(50%-0.5rem)] sm:basis-[180px] sm:flex-none sm:w-[180px]">
                    <User className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {sharedUsers
                      .filter((u) => {
                        const normalize = (p?: string | null) =>
                          p?.replace(/^@/, "").toLowerCase() ?? "";
                        return normalize(u.profileName) !== normalize(currentUser?.profileName);
                      })
                      .map((u) => (
                        <SelectItem key={u.profileName} value={u.profileName}>
                          <span className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {u.avatar ? (
                                <img
                                  src={getImageUrl(u.avatar)}
                                  alt={u.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {u.profileName.charAt(1).toUpperCase()}
                                </span>
                              )}
                            </span>
                            {u.profileName}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={datePreset}
                onValueChange={(v) => {
                  setDatePreset(v);
                  if (v !== "custom") {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }
                  if (v !== "all") setUserFilter("all");
                }}
              >
                <SelectTrigger className={cn("min-w-0 w-full basis-full sm:basis-[180px] sm:flex-none sm:w-[180px] transition-opacity", userFilter !== "all" && "opacity-40")}>
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === "none" ? "asc" : prev === "asc" ? "desc" : "none",
                  )
                }
                className={cn("shrink-0 transition-opacity", userFilter !== "all" && "opacity-40")}
                title={
                  sortOrder === "asc"
                    ? "Ordem alfabética (A-Z)"
                    : sortOrder === "desc"
                      ? "Ordem alfabética (Z-A)"
                      : "Sem ordenação"
                }
              >
                {sortOrder === "desc" ? (
                  <ArrowDownZA className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4 mr-2" />
                )}
                {sortOrder === "asc" ? "A-Z" : sortOrder === "desc" ? "Z-A" : "Ordenar"}
              </Button>
            </div>

            {datePreset === "custom" && (
              <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3 transition-opacity", userFilter !== "all" && "opacity-40")}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 basis-[calc(50%-0.5rem)] justify-start text-left font-normal sm:flex-none sm:w-[180px]",
                        !dateFrom && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(date) => date > new Date() || (dateTo ? date > dateTo : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground shrink-0">até</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 basis-[calc(50%-0.5rem)] justify-start text-left font-normal sm:flex-none sm:w-[180px]",
                        !dateTo && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-border" />

        {list.movies.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <Film className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Lista vazia</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione filmes usando o botão acima
            </p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <Filter className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Nenhum filme encontrado com os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-5">
            {filteredMovies.map((movie) => {
              const url = getPosterUrl(movie.poster_path);
              const rating = movieRatings[movie.id];
              const ratingDate = rating?.createdAt
                ? parseLocalDate(rating.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              const normalize = (p?: string | null) => p?.replace(/^@/, "").toLowerCase() ?? "";

              const othersRatings = list.isShared
                ? (getMovieSharedRatings(movie.id) || []).filter(
                    (r) =>
                      normalize(r.profileName) !== normalize(currentUser.profileName) &&
                      r.rating !== null &&
                      r.rating !== undefined,
                  )
                : [];

              return (
                <div
                  key={movie.id}
                  className="group relative overflow-visible rounded-lg border border-border bg-card animate-fade-in"
                >
                  <Link to={`/movie/${movie.id}`} className="block">
                    <div className="aspect-[2/3] overflow-hidden rounded-t-lg">
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
                    <div className="space-y-1.5 p-2 sm:p-3">
                      <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-4 text-card-foreground sm:min-h-[2.5rem] sm:text-sm sm:leading-5">
                        {movie.title}
                      </h3>

                      {othersRatings.length > 0 && (
                        <div className="space-y-1.5 pb-1.5 border-b border-border">
                          {othersRatings.map((r) => (
                            <div
                              key={r.profileName}
                              className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
                            >
                              <div className="relative h-5 w-5 shrink-0">
                                <Link
                                  to={`/usuario/${r.profileName}`}
                                  className="peer block h-5 w-5 rounded-full overflow-hidden bg-muted"
                                >
                                  {r.avatar ? (
                                    <img
                                      src={getImageUrl(r.avatar)}
                                      alt={r.profileName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full w-full text-[9px]">
                                      {r.profileName.charAt(1).toUpperCase()}
                                    </div>
                                  )}
                                </Link>
                                <div
                                  className="
              pointer-events-none
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              whitespace-nowrap
              rounded-md bg-popover border border-border
              px-2 py-1 text-[10px] text-popover-foreground
              shadow-md
              opacity-0 scale-95
              transition-all duration-150
              peer-hover:opacity-100 peer-hover:scale-100
            "
                                >
                                  {r.profileName}
                                </div>
                              </div>

                              <div className="flex min-w-0 flex-wrap items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < r.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-transparent text-star-empty"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {rating && (
                        <>
                          <div className="flex flex-wrap items-center gap-0.5">
                            {list.isShared && (
                              <div className="relative h-7 w-7 shrink-0 mr-1">
                                <Link
                                  to={`/perfil`}
                                  className="peer block h-7 w-7 rounded-full overflow-hidden bg-muted"
                                >
                                  {currentUser.avatar ? (
                                    <img
                                      src={getImageUrl(currentUser.avatar)}
                                      alt={currentUser.profileName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full w-full text-[9px] border rounded-full">
                                      {currentUser.profileName.charAt(1).toUpperCase()}
                                    </div>
                                  )}
                                </Link>
                                <div
                                  className="
              pointer-events-none
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              whitespace-nowrap
              rounded-md bg-popover border border-border
              px-2 py-1 text-[10px] text-popover-foreground
              shadow-md
              opacity-0 scale-95
              transition-all duration-150
              peer-hover:opacity-100 peer-hover:scale-100
            "
                                >
                                  {currentUser?.profileName}
                                </div>
                              </div>
                            )}
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${s <= rating.rating ? "fill-star text-star" : "fill-transparent text-star-empty"}`}
                              />
                            ))}
                          </div>
                          {ratingDate && (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              <span className="truncate">{ratingDate}</span>
                            </div>
                          )}
                          {rating.platform && (
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                              <PlatformBadge value={rating.platform} />
                              <span className="truncate">
                                {PLATFORMS.find((p) => p.value === rating.platform)?.label ||
                                  rating.platform}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemove(movie.id)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-100 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ListDetail;
