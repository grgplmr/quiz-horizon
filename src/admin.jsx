import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './admin.css';

const CATEGORIES = [
  { slug: 'aerodynamique', label: 'Aérodynamique' },
  { slug: 'histoire', label: 'Histoire' },
  { slug: 'navigation', label: 'Navigation' },
  { slug: 'meteo', label: 'Météorologie' },
  { slug: 'reglementation', label: 'Réglementation' },
  { slug: 'securite', label: 'Sécurité' },
];

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hbia-theme') || 'light');
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('hbia-theme', theme);
  }, [theme]);
  return [theme, setTheme];
}

async function fetchQuizzes(setState) {
  setState((s) => ({ ...s, loading: true }));
  try {
    const res = await fetch('../api/upload.php');
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
    const preview = lines.slice(0, 4).map((line) => line.split(';').map((cell) => cell.trim()));
    setPreview(preview);
  };
  reader.readAsText(file, 'utf-8');
}

async function uploadCsv({ file, title, category, setStatus, refresh }) {
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  form.append('title', title || file.name.replace(/\.csv$/i, ''));
  form.append('category', category || 'autre');
  setStatus('Envoi...');
  const res = await fetch('../api/upload.php', { method: 'POST', body: form });
  const data = await res.json();
  if (!data.success) {
    setStatus(`Erreur : ${data.error || 'upload'}`);
  } else {
    setStatus('Quiz importé ✔');
    refresh();
  }
}

async function deleteQuiz(filename, refresh, setStatus) {
  setStatus('Suppression...');
  const res = await fetch('../api/upload.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: filename }),
  });
  const data = await res.json();
  setStatus(data.success ? 'Supprimé' : data.error || 'Erreur');
  if (data.success) refresh();
}

function AdminApp() {
  const [theme, setTheme] = useTheme();
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('aerodynamique');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    fetchQuizzes(setState);
  }, []);

  return (
    <div className="app-shell">
      <div className="header">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => (window.location = '../')}>
          <span className="dot" />
          <div>
            <div>Admin HorizonBIA</div>
            <div className="muted">Gestion des quiz</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="btn btn-ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙 Mode sombre' : '☀️ Mode clair'}
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="panel">
          <h3>Importer un CSV</h3>
          <p className="muted">Colonnes : question; choix1; choix2; choix3; choix4; bonne_reponse(1-4); explication</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files[0];
              setFile(f);
              if (f) parseCsvPreview(f, setPreview);
            }}
          />
          <input
            type="text"
            placeholder="Titre du quiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginTop: 10 }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginTop: 10 }}>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
          {preview.length > 0 && (
            <div className="preview-card">
              <strong>Aperçu</strong>
              {preview.map((line, idx) => (
                <div key={idx} className="muted">
                  {line.join(' · ')}
                </div>
              ))}
            </div>
          )}
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => uploadCsv({ file, title, category, setStatus, refresh: () => fetchQuizzes(setState) })}
            >
              Importer
            </button>
            {status && <span className="muted">{status}</span>}
          </div>
        </div>

        <div className="panel">
          <h3>Quiz existants</h3>
          {state.loading ? (
            <p className="muted">Chargement...</p>
          ) : state.items.length === 0 ? (
            <p>Aucun quiz pour le moment</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((quiz) => (
                  <tr key={quiz.file}>
                    <td>{quiz.file}</td>
                    <td>{quiz.title}</td>
                    <td>
                      <span className="tag">{quiz.category}</span>
                    </td>
                    <td>{quiz.questions || '-'}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => deleteQuiz(quiz.file, () => fetchQuizzes(setState), setStatus)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {status && <p className="muted">{status}</p>}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AdminApp />);
