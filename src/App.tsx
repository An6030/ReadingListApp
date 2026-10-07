import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  Library,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<
  Status,
  { label: string; short: string; icon: typeof Bookmark; color: string; ring: string; dot: string; chip: string }
> = {
  want: {
    label: 'Want to Read',
    short: 'Want',
    icon: Bookmark,
    color: 'text-amber-700',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  reading: {
    label: 'Reading',
    short: 'Reading',
    icon: BookOpen,
    color: 'text-sky-700',
    ring: 'ring-sky-300',
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  finished: {
    label: 'Finished',
    short: 'Done',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    ring: 'ring-emerald-300',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const STATUS_ORDER: Status[] = ['want', 'reading', 'finished'];
const STORAGE_KEY = 'reading-list:books';

type Filter = 'all' | Status;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'want', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Finished' },
];

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) => b && typeof b.title === 'string' && STATUS_ORDER.includes(b.status)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [draftStatus, setDraftStatus] = useState<Status>('want');
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: books.length, want: 0, reading: 0, finished: 0 };
    for (const b of books) c[b.status]++;
    return c;
  }, [books]);

  const visibleBooks = useMemo(() => {
    const list = filter === 'all' ? books : books.filter((b) => b.status === filter);
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [books, filter]);

  function addBook(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) {
      setError(null);
      return;
    }
    if (title.length > 60) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const normalized = title.replace(/\s+/g, ' ').toLowerCase();
    const exists = books.some(
      (b) => b.title.replace(/\s+/g, ' ').toLowerCase() === normalized
    );
    if (exists) {
      setError('This book is already in your reading list.');
      return;
    }
    const book: Book = {
      id: crypto.randomUUID(),
      title,
      status: draftStatus,
    };
    setBooks((prev) => [book, ...prev]);
    setDraft('');
    setDraftStatus('want');
    setError(null);
  }

  function setStatus(id: string, status: Status) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    setMenuOpenId(null);
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setMenuOpenId(null);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Library size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Reading List</h1>
              <p className="text-xs text-stone-500 sm:text-sm">
                Track your books, {counts.all} {counts.all === 1 ? 'title' : 'titles'} saved
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
        {/* Add form */}
        <form
          onSubmit={addBook}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <label htmlFor="book-title" className="mb-2 block text-sm font-medium text-stone-700">
            Add a book
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="book-title"
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              placeholder="Enter book title"
              className="flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              maxLength={120}
            />
            <select
              value={draftStatus}
              onChange={(e) => {
                setDraftStatus(e.target.value as Status);
                setError(null);
              }}
              className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              aria-label="Default reading status"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </form>

        {/* Filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter books by status">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <SummaryCard label="Total Books" value={counts.all} icon={Library} tone="stone" />
          <SummaryCard label="Currently Reading" value={counts.reading} icon={BookOpen} tone="sky" />
          <SummaryCard label="Finished" value={counts.finished} icon={CheckCircle2} tone="emerald" />
        </div>

        {/* List / empty states */}
        <div className="mt-6">
          {books.length === 0 ? (
            <EmptyState />
          ) : visibleBooks.length === 0 ? (
            <NoMatches />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  menuOpen={menuOpenId === book.id}
                  onToggleMenu={() =>
                    setMenuOpenId((cur) => (cur === book.id ? null : book.id))
                  }
                  onSetStatus={(s) => setStatus(book.id, s)}
                  onRemove={() => removeBook(book.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Click-away for menus */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenId(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Library size={26} />
      </div>
      <p className="text-base font-medium text-stone-700">
        Your reading list is empty. Add your first book.
      </p>
      <p className="mt-1 text-sm text-stone-400">
        Use the form above to start building your list.
      </p>
    </div>
  );
}

function NoMatches() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Search size={26} />
      </div>
      <p className="text-base font-medium text-stone-700">No books in this category.</p>
      <p className="mt-1 text-sm text-stone-400">Try a different filter.</p>
    </div>
  );
}

interface BookCardProps {
  book: Book;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onSetStatus: (s: Status) => void;
  onRemove: () => void;
}

function BookCard({ book, menuOpen, onToggleMenu, onSetStatus, onRemove }: BookCardProps) {
  const meta = STATUS_META[book.status];
  const Icon = meta.icon;

  return (
    <li className="relative rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-stone-900 sm:text-base">
            {book.title}
          </h3>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Change status"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon size={18} className={meta.color} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${book.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-30 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {STATUS_ORDER.map((s) => {
            const M = STATUS_META[s];
            const SIcon = M.icon;
            const current = s === book.status;
            return (
              <button
                key={s}
                role="menuitem"
                onClick={() => onSetStatus(s)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
              >
                <SIcon size={15} className={M.color} />
                <span className="flex-1">{M.label}</span>
                {current && <Check size={15} className="text-stone-900" />}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

const SUMMARY_TONE: Record<string, { bg: string; icon: string; value: string }> = {
  stone: { bg: 'bg-stone-50', icon: 'text-stone-500', value: 'text-stone-900' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-500', value: 'text-sky-900' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', value: 'text-emerald-900' },
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Library;
  tone: keyof typeof SUMMARY_TONE;
}) {
  const t = SUMMARY_TONE[tone];
  return (
    <div className={`rounded-2xl border border-stone-200 ${t.bg} p-3 sm:p-4`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={t.icon} />
        <span className="text-xs font-medium text-stone-500 sm:text-sm">{label}</span>
      </div>
      <p className={`mt-1.5 text-xl font-bold tabular-nums sm:text-2xl ${t.value}`}>{value}</p>
    </div>
  );
}

