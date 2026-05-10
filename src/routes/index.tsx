import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wheel } from "@/components/Wheel";

export const Route = createFileRoute("/")({
  component: Index,
});

interface SavedWheel {
  id: string;
  name: string;
  options: string[];
}

const STORAGE_KEY = "lucky-wheels-v1";

function loadWheels(): SavedWheel[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function Index() {
  const [options, setOptions] = useState<string[]>(["奶茶", "咖啡", "果茶", "气泡水"]);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<SavedWheel[]>([]);
  const [name, setName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadWheels());
  }, []);

  const persist = (list: SavedWheel[]) => {
    setSaved(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addOption = () => {
    const v = draft.trim();
    if (!v) return;
    setOptions([...options, v]);
    setDraft("");
  };

  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  const saveWheel = () => {
    const n = name.trim() || `转盘 ${saved.length + 1}`;
    if (options.length < 2) return;
    if (activeId) {
      const list = saved.map((w) => (w.id === activeId ? { ...w, name: n, options } : w));
      persist(list);
    } else {
      const w = { id: crypto.randomUUID(), name: n, options };
      persist([w, ...saved]);
      setActiveId(w.id);
    }
    setName(n);
  };

  const loadWheel = (w: SavedWheel) => {
    setActiveId(w.id);
    setName(w.name);
    setOptions(w.options);
    setResult(null);
  };

  const newWheel = () => {
    setActiveId(null);
    setName("");
    setOptions([]);
    setResult(null);
  };

  const deleteWheel = (id: string) => {
    persist(saved.filter((w) => w.id !== id));
    if (activeId === id) newWheel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Soft background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-secondary/40 blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/70 backdrop-blur border border-border/60 text-xs text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            小清新 · 公平随机
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            幸运 <span className="text-primary">转盘</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            自定义你的选项，保存方案，让选择变得更轻松
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 sm:gap-8">
          {/* Wheel area */}
          <section className="bg-card/60 backdrop-blur rounded-3xl border border-border/60 p-6 sm:p-10 shadow-sm flex flex-col items-center">
            <Wheel options={options} onResult={(r) => setResult(r)} />
          </section>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Name + save */}
            <div className="bg-card/70 backdrop-blur rounded-2xl border border-border/60 p-5 shadow-sm">
              <label className="text-xs font-medium text-muted-foreground">转盘名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：今天午餐吃什么"
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-background/80 border border-border focus:border-primary focus:outline-none text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveWheel}
                  disabled={options.length < 2}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {activeId ? "更新保存" : "保存方案"}
                </button>
                <button
                  onClick={newWheel}
                  className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition"
                >
                  新建
                </button>
              </div>
            </div>

            {/* Options editor */}
            <div className="bg-card/70 backdrop-blur rounded-2xl border border-border/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">选项 ({options.length})</h2>
                <span className="text-xs text-muted-foreground">概率均等</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  placeholder="输入选项后回车添加"
                  className="flex-1 px-3 py-2 rounded-lg bg-background/80 border border-border focus:border-primary focus:outline-none text-sm"
                />
                <button
                  onClick={addOption}
                  className="px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition"
                >
                  +
                </button>
              </div>
              <ul className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {options.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-background/60 border border-border/40 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: `var(--color-wheel-${(i % 8) + 1})` }}
                      />
                      <span className="truncate text-foreground">{o}</span>
                    </span>
                    <button
                      onClick={() => removeOption(i)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                      aria-label="删除"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {options.length === 0 && (
                  <li className="text-xs text-muted-foreground text-center py-4">
                    还没有选项，添加一些试试 ~
                  </li>
                )}
              </ul>
            </div>

            {/* Saved wheels */}
            <div className="bg-card/70 backdrop-blur rounded-2xl border border-border/60 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-3">我的转盘</h2>
              {saved.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">暂无保存的方案</p>
              ) : (
                <ul className="space-y-1.5">
                  {saved.map((w) => (
                    <li
                      key={w.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                        activeId === w.id
                          ? "bg-primary/10 border-primary/40"
                          : "bg-background/50 border-border/40 hover:bg-background/80"
                      }`}
                    >
                      <button onClick={() => loadWheel(w)} className="flex-1 text-left truncate">
                        <div className="font-medium text-foreground truncate">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{w.options.length} 个选项</div>
                      </button>
                      <button
                        onClick={() => deleteWheel(w.id)}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {result && <ResultModal value={result} onClose={() => setResult(null)} />}
    </div>
  );
}

function ResultModal({ value, onClose }: { value: string; onClose: () => void }) {
  const colors = [
    "var(--color-wheel-1)", "var(--color-wheel-2)", "var(--color-wheel-3)",
    "var(--color-wheel-4)", "var(--color-wheel-5)", "var(--color-wheel-6)",
    "var(--color-wheel-7)", "var(--color-wheel-8)",
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 w-2 h-3 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              background: colors[i % colors.length],
              animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 0.6}s linear forwards`,
            }}
          />
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card rounded-3xl border border-border/60 shadow-2xl px-8 sm:px-12 py-10 sm:py-12 text-center max-w-md w-full animate-pop-in"
      >
        <div className="text-4xl mb-3 animate-float-soft">🌿</div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">恭喜抽中</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground break-words">{value}</h2>
        <div className="mt-4 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-primary via-accent to-secondary" />
        <p className="mt-5 text-sm text-muted-foreground">愿你拥有美好的一天 ✨</p>
        <button
          onClick={onClose}
          className="mt-7 px-8 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
        >
          再来一次
        </button>
      </div>
    </div>
  );
}
