import { getImageUrl } from "@/lib/files";
import { useState, useEffect, useRef, useCallback } from "react";
import { getGenreColor } from "@/lib/genreColors";
import { Link } from "react-router-dom";
import {
  Search,
  Star,
  Film,
  List,
  Users,
  UserPlus,
  Camera,
  Pencil,
  X,
  Upload,
  Lock,
  MessageCircle,
  Loader2,
  Heart,
  Plus,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  getMyProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  changePassword,
  removeAvatar,
  deleteAccount,
  searchUsers,
  getFollowers,
  getFollowing,
  UserProfile,
  getUserProfile,
  getFavoriteMovies,
  addFavoriteMovie,
  removeFavoriteMovie,
  FavoriteMovie,
} from "@/lib/profile";
import { removeToken } from "@/lib/api";
import { getMovieDetails, searchMovies, getPosterUrl, type Movie } from "@/lib/tmdb";
import { getLists } from "@/lib/movieLists";
import { getUserRatings } from "@/lib/ratings";

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; profileName: string; avatar: string }[]
  >([]);
  const [editOpen, setEditOpen] = useState(false);
  const [followDialog, setFollowDialog] = useState<"followers" | "following" | null>(null);
  const [followSearch, setFollowSearch] = useState("");
  const [followList, setFollowList] = useState<
    { name: string; profileName: string; avatar: string }[]
  >([]);
  const [editName, setEditName] = useState("");
  const [editProfileName, setEditProfileName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [favDialogOpen, setFavDialogOpen] = useState(false);
  const [favSearchQuery, setFavSearchQuery] = useState("");
  const [favSearchResults, setFavSearchResults] = useState<Movie[]>([]);
  const [favSearching, setFavSearching] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      if (data.topGenres?.length) {
        setTopGenres(data.topGenres);
      }
      if (data.favoriteMovies?.length) {
        setFavorites(data.favoriteMovies);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!favDialogOpen) return;
    if (!favSearchQuery.trim()) {
      setFavSearchResults([]);
      return;
    }
    setFavSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchMovies(favSearchQuery);
        setFavSearchResults(res.results.slice(0, 12));
      } catch {
        setFavSearchResults([]);
      } finally {
        setFavSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [favSearchQuery, favDialogOpen]);

  const handleAddFavorite = async (movie: Movie) => {
    if (favorites.some((f) => f.id === movie.id)) {
      toast.info("Esse filme já está nos seus favoritos.");
      return;
    }
    try {
      await addFavoriteMovie(movie.id);
      setFavorites((prev) => [
        ...prev,
        { id: movie.id, title: movie.title, poster_path: movie.poster_path },
      ]);
      toast.success("Adicionado aos favoritos!");
    } catch (err) {
      toast.error(err.message || "Só é possível adicionar até 4 filmes aos favoritos.");
    }
  };

  const handleRemoveFavorite = async (movieId: number) => {
    try {
      await removeFavoriteMovie(movieId);
      setFavorites((prev) => prev.filter((f) => f.id !== movieId));
      toast.success("Removido dos favoritos.");
    } catch (err) {
      toast.error(err.message || "Erro ao remover favorito");
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);

        const filtered = results.filter(
          (u) =>
            u.profileName.replace("@", "").toLowerCase() !==
            profile?.profileName.replace("@", "").toLowerCase(),
        );

        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await updateAvatar(file);
      localStorage.setItem(
        "tmetrage_profile",
        JSON.stringify({
          name: updated.name,
          profileName: updated.profileName,
          avatar: updated.avatar,
        }),
      );

      window.dispatchEvent(new Event("profileUpdated"));

      setProfile((prev) => (prev ? { ...prev, avatar: updated.avatar } : prev));
      setAvatarDialogOpen(false);
      toast.success("Avatar atualizado!");
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar avatar");
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await updateCover(file);
      setProfile(updated);
      toast.success("Capa atualizada!");
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar capa");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: editName.trim(),
        profileName: editProfileName.trim(),
        bio: editBio.trim(),
      });
      setProfile(updated);
      // Update localStorage for navbar
      const formattedUsername = updated.profileName.startsWith("@")
        ? updated.profileName
        : `@${updated.profileName}`;
      localStorage.setItem(
        "tmetrage_profile",
        JSON.stringify({
          name: updated.name,
          profileName: formattedUsername,
          username: formattedUsername,
          bio: updated.bio,
          avatar: updated.avatar,
          cover: updated.cover,
          followers: updated.followers,
          following: updated.following,
        }),
      );
      setEditOpen(false);
      toast.success("Perfil atualizado!");
    } catch (err) {
      toast.error(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordError("");
      setPasswordDialogOpen(false);
      toast.success("Senha alterada com sucesso!");
    } catch (err) {
      setPasswordError(err.message || "Erro ao alterar senha");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      removeToken();
      localStorage.removeItem("tmetrage_profile");
      window.location.href = "/";
    } catch (err) {
      toast.error(err.message || "Erro ao excluir conta");
    }
  };

  const handleOpenFollowDialog = async (type: "followers" | "following") => {
    setFollowDialog(type);
    try {
      const list = type === "followers" ? await getFollowers() : await getFollowing();
      setFollowList(list);
    } catch {
      setFollowList([]);
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
          <p className="text-muted-foreground">Erro ao carregar perfil. Faça login novamente.</p>
          <Link to="/login">
            <Button className="mt-4">Ir para login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayUsername = profile.profileName.startsWith("@")
    ? profile.profileName
    : `@${profile.profileName}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverChange}
      />

      {/* Cover Image */}
      <div className="group relative h-40 w-full overflow-hidden bg-secondary sm:h-48 md:h-56">
        {profile.cover && (
          <img
            src={getImageUrl(profile.cover)}
            alt="Capa do perfil"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => coverInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Alterar capa
          </Button>
        </div>
      </div>

      <div className="container relative px-4 sm:px-6 lg:px-8">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <div
            className="group relative shrink-0 cursor-pointer"
            onClick={() => setAvatarDialogOpen(true)}
          >
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg sm:h-32 sm:w-32">
              <AvatarImage src={getImageUrl(profile.avatar)} />
              <AvatarFallback className="bg-primary text-2xl font-display text-primary-foreground sm:text-3xl">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/50">
              <Camera className="h-5 w-5 text-foreground" />
            </div>
          </div>

          <div className="w-full min-w-0 flex-1 pb-2">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words font-display text-2xl font-bold text-foreground">
                  {profile.name}
                </h1>
                <p className="break-all text-sm text-muted-foreground">{displayUsername}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 sm:w-auto"
                onClick={() => {
                  setEditName(profile.name);
                  setEditProfileName(profile.profileName);
                  setEditBio(profile.bio);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar perfil
              </Button>
            </div>
          </div>
        </div>

        <p className="mb-6 max-w-xl break-words text-sm text-muted-foreground">{profile.bio}</p>

        {/* Followers / Following */}
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-3">
          <button
            onClick={() => handleOpenFollowDialog("followers")}
            className="flex min-w-0 items-center gap-2 text-sm transition-opacity hover:opacity-80"
          >
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{profile.followers}</span>
            <span className="text-muted-foreground">seguidores</span>
          </button>
          <button
            onClick={() => handleOpenFollowDialog("following")}
            className="flex min-w-0 items-center gap-2 text-sm transition-opacity hover:opacity-80"
          >
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{profile.following}</span>
            <span className="text-muted-foreground">seguindo</span>
          </button>
        </div>

        {/* Favorite Movies */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Heart className="h-5 w-5 text-primary" />
              Filmes favoritos
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setFavSearchQuery("");
                setFavSearchResults([]);
                setFavDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem filmes favoritos. Clique em "Adicionar" para começar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
              {favorites.map((movie) => {
                const poster = getPosterUrl(movie.poster_path);
                return (
                  <div
                    key={movie.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <Link to={`/movie/${movie.id}`} className="block">
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
                    </Link>

                    {/* Title — always visible on mobile, on hover for desktop */}
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white sm:text-xs">
                        {movie.title}
                      </p>
                    </div>

                    {/* Remove button (desktop hover, always visible mobile) */}
                    <button
                      type="button"
                      aria-label="Remover dos favoritos"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFavorite(movie.id);
                      }}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-100 backdrop-blur transition-opacity hover:bg-destructive hover:text-destructive-foreground sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Link to="/filmes-avaliados">
            <Card className="bg-card border-border cursor-pointer transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <Film className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{profile.totalRatings}</span>
                <span className="text-center text-xs leading-tight text-muted-foreground">
                  Filmes avaliados
                </span>
              </CardContent>
            </Card>
          </Link>
          <Card className="bg-card border-border">
            <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
              <Star className="h-6 w-6 text-star mb-2" />
              <span className="text-2xl font-bold text-foreground">
                {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "—"}
              </span>
              <span className="text-center text-xs leading-tight text-muted-foreground">
                Nota média
              </span>
            </CardContent>
          </Card>
          <Link to="/listas">
            <Card className="bg-card border-border cursor-pointer transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <List className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">
                  {profile.totalLists > 0 ? profile.totalLists : "—"}
                </span>
                <span className="text-center text-xs leading-tight text-muted-foreground">
                  Listas criadas
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/comentarios">
            <Card className="bg-card border-border cursor-pointer transition-colors hover:border-primary/40">
              <CardContent className="flex min-h-32 flex-col items-center justify-center px-2 py-5 text-center sm:py-6">
                <MessageCircle className="h-6 w-6 text-accent mb-2" />
                <span className="text-2xl font-bold text-foreground">{profile.totalComments}</span>
                <span className="text-center text-xs leading-tight text-muted-foreground">
                  Comentários
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Favorite Genres */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Gêneros Favoritos
          </h2>
          {topGenres?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topGenres?.map((g) => {
                const colors = getGenreColor(g.name);
                return (
                  <Link
                    key={g.name}
                    to={`/filmes-avaliados?genre=${encodeURIComponent(g.name)}`}
                    className="max-w-full rounded-full px-3 py-1.5 text-sm font-medium transition-transform hover:scale-105 hover:opacity-90 sm:px-4"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {g.name} <span style={{ color: colors.text, opacity: 0.75 }}>({g.count})</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Avalie filmes para ver seus gêneros favoritos.
            </p>
          )}
        </div>

        {/* Profile Search */}
        <div className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Buscar Perfis</h2>
          <div className="flex w-full max-w-md items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou @usuário"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {searchQuery.trim() && (
            <div className="mt-3 max-w-md space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <Link
                    key={u.profileName}
                    to={`/usuario/${u.profileName.replace("@", "")}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {u.avatar ? (
                        <AvatarImage src={getImageUrl(u.avatar)} />
                      ) : (
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-foreground">{u.name}</p>
                      <p className="break-all text-xs text-muted-foreground">
                        {u.profileName.startsWith("@") ? u.profileName : `@${u.profileName}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary">Ver perfil →</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum perfil encontrado.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Preview Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-36 w-36 border-2 border-border sm:h-48 sm:w-48">
              <AvatarImage src={getImageUrl(profile.avatar)} />
              <AvatarFallback className="bg-primary text-primary-foreground text-6xl font-display">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Alterar foto
            </Button>
            {profile.avatar && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-2"
                onClick={async () => {
                  try {
                    await removeAvatar();

                    // atualizar perfil na tela
                    setProfile((prev) => (prev ? { ...prev, avatar: null } : prev));

                    // atualizar localStorage (usado pela navbar)
                    const saved = localStorage.getItem("tmetrage_profile");
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      parsed.avatar = null;
                      localStorage.setItem("tmetrage_profile", JSON.stringify(parsed));
                    }

                    // avisar navbar para atualizar
                    window.dispatchEvent(new Event("profileUpdated"));

                    setAvatarDialogOpen(false);
                    toast.success("Avatar removido!");
                  } catch (err) {
                    toast.error(err.message || "Erro ao remover avatar");
                  }
                }}
              >
                <X className="h-4 w-4" />
                Remover foto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Seu nome"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Usuário</label>
              <Input
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
                placeholder="@usuario"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Fale um pouco sobre você..."
                rows={3}
                maxLength={200}
              />
            </div>
            <Button
              className="w-full"
              disabled={!editName.trim() || saving}
              onClick={handleSaveProfile}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar alterações
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError("");
                setPasswordDialogOpen(true);
              }}
            >
              <Lock className="h-4 w-4" />
              Alterar senha
            </Button>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2">Zona de perigo</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Excluir conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers / Following Dialog */}
      <Dialog
        open={followDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFollowDialog(null);
            setFollowSearch("");
            setFollowList([]);
          }
        }}
      >
        <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{followDialog === "followers" ? "Seguidores" : "Seguindo"}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={followSearch}
              onChange={(e) => setFollowSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[55svh] space-y-2 overflow-y-auto pr-1">
            {followList
              .filter(
                (u) =>
                  !followSearch.trim() ||
                  u.name.toLowerCase().includes(followSearch.toLowerCase()) ||
                  u.profileName.toLowerCase().includes(followSearch.toLowerCase()),
              )
              .map((u) => (
                <Link
                  key={u.profileName}
                  to={`/usuario/${u.profileName.replace("@", "")}`}
                  onClick={() => {
                    setFollowDialog(null);
                    setFollowSearch("");
                    setFollowList([]);
                  }}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {u.avatar ? (
                      <AvatarImage src={getImageUrl(u.avatar)} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {u.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="break-all text-xs text-muted-foreground">
                      {u.profileName.startsWith("@") ? u.profileName : `@${u.profileName}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">Ver perfil →</span>
                </Link>
              ))}
            {followList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha atual</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nova senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar nova senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <Button
              className="w-full"
              disabled={!currentPassword || !newPassword || !confirmPassword}
              onClick={handleChangePassword}
            >
              Salvar nova senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Favorite Movie Dialog */}
      <Dialog open={favDialogOpen} onOpenChange={setFavDialogOpen}>
        <DialogContent className="max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Adicionar filmes favoritos
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Pesquise um filme pelo título..."
              value={favSearchQuery}
              onChange={(e) => setFavSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-3 max-h-[55svh] overflow-y-auto pr-1">
            {favSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : favSearchQuery.trim() === "" ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Digite o nome de um filme para começar.
              </p>
            ) : favSearchResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum filme encontrado.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {favSearchResults.map((movie) => {
                  const poster = getPosterUrl(movie.poster_path);
                  const isFav = favorites.some((f) => f.id === movie.id);
                  return (
                    <div
                      key={movie.id}
                      className="flex gap-2 rounded-lg border border-border bg-card p-2"
                    >
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-muted">
                        {poster ? (
                          <img
                            src={poster}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                          {movie.title}
                        </p>
                        <Button
                          size="sm"
                          variant={isFav ? "secondary" : "default"}
                          disabled={isFav}
                          className="h-7 gap-1 px-2 text-[11px]"
                          onClick={() => handleAddFavorite(movie)}
                        >
                          {isFav ? (
                            "Adicionado"
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Adicionar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {favorites.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Seus favoritos ({favorites.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {favorites.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    {f.title}
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(f.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remover ${f.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
