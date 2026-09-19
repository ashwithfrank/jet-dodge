import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { createGame } from "@/game";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const game = createGame(host);
    return () => game.destroy();
  }, []);

  return (
    <main className="h-dvh w-full overflow-hidden bg-bg text-fg">
      <div ref={ref} className="h-full w-full">
        <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs tracking-[0.28em] text-muted uppercase">Void Sector 07</p>
          <h1 className="text-4xl font-semibold tracking-[0.12em] sm:text-6xl">
            JET<span className="text-primary">//</span>DODGE
          </h1>
          <p className="text-sm tracking-[0.34em] text-primary uppercase">Survive the void</p>
          <p className="text-sm text-muted">Loading playfield</p>
        </div>
      </div>
    </main>
  );
}
