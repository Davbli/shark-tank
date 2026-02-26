import { useMemo, useState } from "react";

const exampleRecommendations = [
  {
    name: "Rosewater Silk",
    hex: "#E8B9C5",
    vibe: "Soft romantic shimmer with a barely-there glow.",
    occasion: "Brunch dates or bridal showers",
  },
  {
    name: "Velvet Plum",
    hex: "#7D3B58",
    vibe: "Moody and luxe with berry depth.",
    occasion: "Evening events",
  },
  {
    name: "Cafe Au Lait",
    hex: "#C9A28E",
    vibe: "Warm neutral chic that flatters most tones.",
    occasion: "Everyday polish",
  },
  {
    name: "Petal Glaze",
    hex: "#F5DCE6",
    vibe: "Airy pastel with a glazed finish.",
    occasion: "Spring celebrations",
  },
];

const skinToneOptions = ["Fair", "Light", "Medium", "Tan", "Deep"];
const seasonOptions = ["Spring", "Summer", "Autumn", "Winter"];

export default function App() {
  const [form, setForm] = useState({
    skinTone: "",
    occasion: "",
    mood: "",
    season: "",
    outfitColor: "",
  });
  const [recommendations, setRecommendations] = useState(exampleRecommendations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("Example set shown. Generate to personalize.");

  const hasInputs = useMemo(() => {
    return Object.values(form).some((value) => value.trim().length > 0);
  }, [form]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const buildPrompt = () => {
    return `You are a nail polish color curator. Based on the client preferences below, return 4 to 6 nail polish recommendations.\n\nPreferences:\n- Skin tone: ${form.skinTone || "Not specified"}\n- Occasion: ${form.occasion || "Not specified"}\n- Mood: ${form.mood || "Not specified"}\n- Season: ${form.season || "Not specified"}\n- Outfit color: ${form.outfitColor || "Not specified"}\n\nRules:\n- Respond ONLY with valid JSON.\n- Return an array of objects.\n- Each object must include: name, hex, vibe, occasion.\n- Hex codes must be 6-digit format (e.g., #F2C1D1).\n- Vibe should be a short phrase describing the feel.\n- Occasion should be a short phrase for when it fits best.\n- Make colors flattering, cohesive, and varied (neutrals + statement).`;
  };

  const parseRecommendations = (text) => {
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch (initialError) {
      const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
      const objectMatch = trimmed.match(/\{[\s\S]*\}/);
      const candidate = arrayMatch ? arrayMatch[0] : objectMatch ? objectMatch[0] : null;
      if (!candidate) {
        throw initialError;
      }
      return JSON.parse(candidate);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!hasInputs) {
      setError("Add at least one preference so the palette feels personal.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: buildPrompt(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.text || "";
      const parsed = parseRecommendations(content);

      if (!Array.isArray(parsed)) {
        throw new Error("Gemini response was not a JSON array.");
      }

      const cleaned = parsed
        .filter((item) => item && item.name && item.hex)
        .map((item) => ({
          name: item.name,
          hex: item.hex,
          vibe: item.vibe || "",
          occasion: item.occasion || "",
        }))
        .slice(0, 6);

      if (!cleaned.length) {
        throw new Error("Gemini response did not include usable colors.");
      }

      setRecommendations(cleaned);
      setSource("Personalized by Claude based on your inputs.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pearl">
      <div className="hero-gradient">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-12">
          <section className="flex-1">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-berry">
                Polish Muse
              </span>
              <h1 className="font-display text-4xl leading-tight text-cacao sm:text-5xl">
                Your personalized nail polish palette, styled like a beauty editor.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-cacao/80">
                Tell us the mood, moment, and what you are wearing. Claude will curate a mix of
                neutrals and statements with matching hex codes so you can shop or DIY.
              </p>
              <div className="rounded-3xl bg-white/80 p-6 shadow-glow backdrop-blur">
                <form className="grid gap-4" onSubmit={handleSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm">
                      Skin tone
                      <select
                        className="rounded-2xl border border-blush/60 bg-white px-4 py-2"
                        value={form.skinTone}
                        onChange={handleChange("skinTone")}
                      >
                        <option value="">Select</option>
                        {skinToneOptions.map((tone) => (
                          <option key={tone} value={tone}>
                            {tone}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Season
                      <select
                        className="rounded-2xl border border-blush/60 bg-white px-4 py-2"
                        value={form.season}
                        onChange={handleChange("season")}
                      >
                        <option value="">Select</option>
                        {seasonOptions.map((season) => (
                          <option key={season} value={season}>
                            {season}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 text-sm">
                    Occasion
                    <input
                      className="rounded-2xl border border-blush/60 bg-white px-4 py-2"
                      placeholder="Ex. engagement party, workweek, vacation"
                      value={form.occasion}
                      onChange={handleChange("occasion")}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Mood
                    <input
                      className="rounded-2xl border border-blush/60 bg-white px-4 py-2"
                      placeholder="Ex. romantic, bold, clean girl, playful"
                      value={form.mood}
                      onChange={handleChange("mood")}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Outfit color
                    <input
                      className="rounded-2xl border border-blush/60 bg-white px-4 py-2"
                      placeholder="Ex. ivory satin, denim, emerald green"
                      value={form.outfitColor}
                      onChange={handleChange("outfitColor")}
                    />
                  </label>
                  {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                      {error}
                    </div>
                  )}
                  <button
                    className="flex items-center justify-center gap-2 rounded-full bg-berry px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-cacao"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Curating..." : "Generate palette"}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="flex-1">
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl bg-white/80 p-6 shadow-glow backdrop-blur">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl text-cacao">Your palette</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-berry">{source}</span>
                </div>
                <p className="mt-2 text-sm text-cacao/70">
                  {hasInputs
                    ? "Each shade is tuned to your vibe. Tap a hex code to copy."
                    : "Enter preferences to unlock a personalized edit."}
                </p>
                <div className="mt-6 grid gap-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.name}
                      className="group flex items-center gap-4 rounded-2xl border border-blush/60 bg-petal/60 p-4"
                    >
                      <div
                        className="h-16 w-16 rounded-2xl shadow-inner transition group-hover:scale-105"
                        style={{ backgroundColor: rec.hex }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg text-cacao">{rec.name}</h3>
                          <button
                            className="rounded-full border border-berry/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-berry transition hover:bg-berry hover:text-white"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(rec.hex)}
                          >
                            {rec.hex}
                          </button>
                        </div>
                        <p className="text-sm text-cacao/70">{rec.vibe}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-cacao/50">
                          Best for: {rec.occasion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-blush/70 bg-white/70 p-6 text-sm text-cacao/70 shadow-glow">
                <p className="font-display text-lg text-cacao">Style notes</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Balance sheer, cream, and glossy finishes for dimension.</li>
                  <li>Keep one shade that works for everyday, one for statement moments.</li>
                  <li>Match your undertone: rosy for cool, caramel for warm, berry for neutral.</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
