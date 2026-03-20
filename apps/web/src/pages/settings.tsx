import { Check, Paintbrush } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";
import { THEME_DEFINITIONS } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <section className="rounded-[20px] border border-border/70 bg-card px-6 py-6 shadow-[0_12px_32px_-24px_color-mix(in_oklab,var(--foreground)_20%,transparent)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Configuracoes
            </Badge>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Aparencia da aplicacao
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Escolha uma paleta global para toda a experiencia. A troca afeta
              header, sidebar, formularios, listagens e areas principais do painel.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
            Tema atual:{" "}
            <span className="font-medium text-foreground">
              {THEME_DEFINITIONS.find((item) => item.value === theme)?.label}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {THEME_DEFINITIONS.map((palette) => {
          const isActive = palette.value === theme;

          return (
            <article
              key={palette.value}
              className={cn(
                "rounded-[20px] border bg-card p-5 transition-all duration-200",
                isActive
                  ? "border-primary/35 shadow-[0_20px_40px_-30px_color-mix(in_oklab,var(--primary)_38%,transparent)]"
                  : "border-border/70 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_20px_40px_-34px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Paintbrush className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">
                      {palette.label}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {palette.description}
                    </p>
                  </div>
                </div>
                {isActive ? (
                  <Badge className="rounded-full px-3 py-1">
                    <Check className="mr-1 size-3.5" />
                    Ativo
                  </Badge>
                ) : null}
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="size-10 rounded-2xl border border-black/5"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Primary</p>
                    <p className="text-xs text-muted-foreground">
                      Acoes, foco e destaque.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="size-10 rounded-2xl border border-black/5"
                    style={{ backgroundColor: palette.secondary }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Secondary</p>
                    <p className="text-xs text-muted-foreground">
                      Apoio visual e superfices suaves.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="size-10 rounded-2xl border border-black/5"
                    style={{ backgroundColor: palette.neutral }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Neutral</p>
                    <p className="text-xs text-muted-foreground">
                      Fundo estrutural e leitura prolongada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Aplicacao inteira
                </p>
                <Button
                  variant={isActive ? "secondary" : "outline"}
                  onClick={() => setTheme(palette.value)}
                >
                  {isActive ? "Selecionado" : "Usar paleta"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
