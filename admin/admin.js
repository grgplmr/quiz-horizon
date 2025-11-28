import React, { useEffect, useState } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";

const h = React.createElement;

const CATEGORIES = [
  { slug: "aerodynamique", label: "Aérodynamique" },
  { slug: "histoire", label: "Histoire" },
  { slug: "navigation", label: "Navigation" },
  { slug: "meteo", label: "Météorologie" },
  { slug: "reglementation", label: "Réglementation" },
  { slug: "securite", label: "Sécurité" },
];

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("hbia-theme") || "light"
  );
  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("hbia-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

async function fetchQuizzes(setState) {
  setState((s) => ({ ...s, loading: true }));
  try {
    const res = await fetch("../api/upload.php");
    const data = await res.json();
    setState({ loading: false, items: data.quizzes || [], error: null });
  } catch (e) {
    setState({ loading: false, items: [], error: e.message });
  }
}

function parseCsvPreview(file, setPreview) {
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split(/\r?\n/).filter(Boolean);
    const preview = lines.slice(0, 4).map((line) => line.split(";").map((cell) => cell.trim()));
    setPreview(preview);
  };
  reader.readAsText(file, "utf-8");
}

async function uploadCsv({ file, title, category, setStatus, refresh }) {
  if (!file) return;
  const form = new FormData();
  form.append("file", file);
  form.append("title", title || file.name.replace(/\.csv$/i, ""));
  form.append("category", category || "autre");
  setStatus("Envoi...");
  const res = await fetch("../api/upload.php", { method: "POST", body: form });
  const data = await res.json();
  if (!data.success) {
    setStatus(`Erreur : ${data.error || "upload"}`);
  } else {
    setStatus("Quiz importé ✔");
    refresh();
  }
}

async function deleteQuiz(filename, refresh, setStatus) {
  setStatus("Suppression...");
  const res = await fetch("../api/upload.php", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: filename }),
  });
  const data = await res.json();
  setStatus(data.success ? "Supprimé" : data.error || "Erreur");
  if (data.success) refresh();
}

function AdminApp() {
  const [theme, setTheme] = useTheme();
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("aerodynamique");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    fetchQuizzes(setState);
  }, []);

  return h(
    "div",
    { className: "app-shell" },
    h(
      "div",
      { className: "header" },
      h(
        "div",
        { className: "logo", style: { cursor: "pointer" }, onClick: () => (window.location = "../") },
        h("span", { className: "dot" }),
        h("div", null, h("div", null, "Admin HorizonBIA"), h("div", { className: "muted" }, "Gestion des quiz"))
      ),
      h(
        "div",
        { className: "top-actions" },
        h(
          "button",
          { className: "btn btn-ghost", onClick: () => setTheme(theme === "light" ? "dark" : "light") },
          theme === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"
        )
      )
    ),
    h(
      "div",
      { className: "admin-grid" },
      h(
        "div",
        { className: "panel" },
        h("h3", null, "Importer un CSV"),
        h("p", { className: "muted" }, "Colonnes attendues : question; choix1; choix2; choix3; choix4; bonne_reponse(1-4); explication"),
        h("input", {
          type: "file",
          accept: ".csv",
          onChange: (e) => {
            const f = e.target.files[0];
            setFile(f);
            if (f) parseCsvPreview(f, setPreview);
          },
        }),
        h("input", {
          type: "text",
          placeholder: "Titre du quiz",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          style: { marginTop: 10 },
        }),
        h(
          "select",
          {
            value: category,
            onChange: (e) => setCategory(e.target.value),
            style: { marginTop: 10 },
          },
          CATEGORIES.map((cat) => h("option", { key: cat.slug, value: cat.slug }, cat.label))
        ),
        preview.length > 0 &&
          h(
            "div",
            { className: "preview-card" },
            h("strong", null, "Aperçu"),
            preview.map((line, idx) => h("div", { key: idx, className: "muted" }, line.join(" · ")))
          ),
        h(
          "div",
          { className: "actions" },
          h(
            "button",
            {
              className: "btn btn-primary",
              onClick: () => uploadCsv({ file, title, category, setStatus, refresh: () => fetchQuizzes(setState) }),
            },
            "Importer"
          ),
          status && h("span", { className: "muted" }, status)
        )
      ),
      h(
        "div",
        { className: "panel" },
        h("h3", null, "Quiz existants"),
        state.loading
          ? h("p", { className: "muted" }, "Chargement...")
          : state.items.length === 0
          ? h("p", null, "Aucun quiz pour le moment")
          : h(
              "table",
              { className: "table" },
              h(
                "thead",
                null,
                h("tr", null, h("th", null, "Fichier"), h("th", null, "Titre"), h("th", null, "Catégorie"), h("th", null, "Questions"), h("th", null, "Actions"))
              ),
              h(
                "tbody",
                null,
                state.items.map((quiz) =>
                  h(
                    "tr",
                    { key: quiz.file },
                    h("td", null, quiz.file),
                    h("td", null, quiz.title),
                    h("td", null, h("span", { className: "tag" }, quiz.category)),
                    h("td", null, quiz.questions || "-"),
                    h(
                      "td",
                      null,
                      h(
                        "button",
                        {
                          className: "btn btn-ghost",
                          onClick: () => deleteQuiz(quiz.file, () => fetchQuizzes(setState), setStatus),
                        },
                        "Supprimer"
                      )
                    )
                  )
                )
              )
            ),
        status && h("p", { className: "muted" }, status)
      )
    )
  );
}

const root = createRoot(document.getElementById("root"));
root.render(h(AdminApp));
