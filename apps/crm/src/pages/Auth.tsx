import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";
import mcLogoImg from "@/assets/branding/MC_Logo.png";
import { DemoModeToggle } from "@/components/DemoModeToggle";

const BRAND_BULLETS = [
  "Clientes y prospectos centralizados",
  "Seguimientos con fechas y alertas",
  "Reportes de ventas por período",
  "Acceso desde cualquier dispositivo",
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<string>("vendedor");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, company_name: companyName || "Mi Empresa" },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Cuenta creada. Revisá tu email para confirmar.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Form column ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[380px] space-y-6 animate-scale-in">
          {/* Logo — visible solo en mobile */}
          <div className="flex flex-col items-center gap-2 md:hidden">
            <img src={logoImg} alt="Mejora Continua" className="h-14 object-contain" />
          </div>

          {/* Heading */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-bold text-foreground"
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              >
                {isLogin ? "Iniciá sesión" : "Creá tu cuenta"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin
                  ? "Ingresá tus credenciales para continuar"
                  : "Completá tus datos para registrarte"}
              </p>
            </div>
            <DemoModeToggle />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Juan Pérez"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Nombre de empresa</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mi Empresa S.A."
                    className="h-9"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="juan@empresa.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••"
                className="h-9"
              />
            </div>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={loading}
            >
              {loading
                ? "Cargando..."
                : isLogin
                ? "Iniciar sesión"
                : "Registrarse"}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Registrate" : "Iniciá sesión"}
            </button>
          </p>

          {/* Legal */}
          <p className="text-center text-xs text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Privacidad
            </Link>
            {" · "}
            <Link
              to="/terms"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Términos
            </Link>
          </p>
        </div>
      </div>

      {/* ── Brand panel (desktop only) ───────────────────────────── */}
      <div className="hidden md:flex flex-col items-center justify-center bg-primary text-primary-foreground w-[480px] shrink-0 relative overflow-hidden">
        {/* Patrón diagonal sutil */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0, white 1px, transparent 1px, transparent 32px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-10 px-12 text-center">
          {/* Logo en caja blanca */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <img
              src={mcLogoImg}
              alt="Mejora Continua"
              className="h-16 w-16 object-contain"
            />
          </div>

          <div>
            <p
              className="text-3xl font-bold tracking-wide"
              style={{ fontFamily: "'League Spartan', sans-serif" }}
            >
              Mejora CRM
            </p>
            <p className="text-primary-foreground/70 mt-2 text-sm leading-relaxed">
              Vendé más. Seguí mejor. Crecé juntos.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-left w-full max-w-xs">
            {BRAND_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                <span className="text-primary-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
