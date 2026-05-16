import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Film, LogIn, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { loginAPI } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = "tmetrage_login_attempts";
function getAttemptData(): { count: number; lockedUntil: number | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return { count: 0, lockedUntil: null };
}
function saveAttemptData(count: number, lockedUntil: number | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lockedUntil }));
}


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const { lockedUntil } = getAttemptData();
    if (lockedUntil && Date.now() < lockedUntil) {
      setRemainingTime(Math.ceil((lockedUntil - Date.now()) / 1000));
    }
  }, []);
  useEffect(() => {
    if (remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          saveAttemptData(0, null);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTime]);
  const isLocked = remainingTime > 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error(`Aguarde ${formatTime(remainingTime)} para tentar novamente`);
      return;
    }
    if (!email.trim() || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await loginAPI(email.trim().toLowerCase(), password);
      saveAttemptData(0, null);

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      const data = getAttemptData();
      const newCount = data.count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS;
        saveAttemptData(newCount, lockedUntil);
        setRemainingTime(Math.ceil(LOCKOUT_MS / 1000));
        toast.error("Muitas tentativas. Tente novamente em 10 minutos.");
      } else {
        saveAttemptData(newCount, null);
        const remaining = MAX_ATTEMPTS - newCount;
        const message =
          err?.response?.data?.message || "Email ou senha incorretos";

        toast.error(
          `${message} (${remaining} tentativa${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""})`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container flex items-center justify-center py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Film className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-foreground">
              Entrar na sua conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse o TMetrage e continue explorando filmes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLocked && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Conta bloqueada. Tente novamente em <strong>{formatTime(remainingTime)}</strong></span>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading || isLocked}>
              <LogIn className="h-4 w-4" />
              {isLocked ? `Bloqueado (${formatTime(remainingTime)})` : loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
