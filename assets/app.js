const COLLECTIONS = ["Owned", "Wishlist", "LoanedOut", "Favorites", "Textbooks", "Manga", "Reference"];
const STATUS_ORDER = ["Unread", "Reading", "Read"];
const STORAGE_KEY = 'personal-library-manager-books';
const THEME_KEY = 'personal-library-manager-theme';

const store = {
  books: [],
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
};

function formatCollectionName(collection) {
  return collection === 'LoanedOut' ? 'Loaned Out' : collection;
}

function parseTags(input) {
  return String(input || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .filter((tag, i, arr) => arr.findIndex(v => v.toLowerCase() === tag.toLowerCase()) === i)
    .sort((a, b) => a.localeCompare(b));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBook(raw) {
  const book = {
    Title: String(raw.Title || '').trim(),
    Author: String(raw.Author || '').trim(),
    Status: STATUS_ORDER.includes(raw.Status) ? raw.Status : 'Unread',
    IsFavorite: Boolean(raw.IsFavorite),
    IsInSeries: Boolean(raw.IsInSeries),
    SeriesName: String(raw.SeriesName || '').trim(),
    SeriesNumber: Number(raw.SeriesNumber) > 0 ? Number(raw.SeriesNumber) : 0,
    BookType: raw.BookType === 'Digital' ? 'Digital' : 'Physical',
    PhysicalType: raw.PhysicalType === 'Hardback' ? 'Hardback' : 'Paperback',
    DigitalType: String(raw.DigitalType || '').trim(),
    IsSpecialEdition: Boolean(raw.IsSpecialEdition),
    Collections: Array.isArray(raw.Collections) ? raw.Collections.filter(c => COLLECTIONS.includes(c)) : [],
    Tags: Array.isArray(raw.Tags) ? raw.Tags : []
  };

  if (!book.IsInSeries) {
    book.SeriesName = '';
    book.SeriesNumber = 0;
  }

  if (book.BookType === 'Physical') {
    book.DigitalType = '';
    if (book.PhysicalType !== 'Hardback') book.IsSpecialEdition = false;
  } else {
    book.PhysicalType = '';
    book.IsSpecialEdition = false;
  }

  if (book.IsFavorite && !book.Collections.includes('Favorites')) {
    book.Collections.push('Favorites');
  }

  if (!book.IsFavorite) {
    book.Collections = book.Collections.filter(c => c !== 'Favorites');
  }

  book.Collections = [...new Set(book.Collections)].sort((a, b) =>
    formatCollectionName(a).localeCompare(formatCollectionName(b))
  );

  book.Tags = parseTags(book.Tags.join(', '));
  return book;
}

function seedBooks() {
  return [
    {
      Title: 'The Hobbit',
      Author: 'J.R.R. Tolkien',
      Status: 'Read',
      IsFavorite: true,
      IsInSeries: false,
      SeriesName: '',
      SeriesNumber: 0,
      BookType: 'Physical',
      PhysicalType: 'Hardback',
      DigitalType: '',
      IsSpecialEdition: true,
      Collections: ['Owned', 'Favorites'],
      Tags: ['fantasy', 'classic']
    },
    {
      Title: 'Words of Radiance',
      Author: 'Brandon Sanderson',
      Status: 'Reading',
      IsFavorite: false,
      IsInSeries: true,
      SeriesName: 'Stormlight Archive',
      SeriesNumber: 2,
      BookType: 'Digital',
      PhysicalType: '',
      DigitalType: 'Kindle',
      IsSpecialEdition: false,
      Collections: ['Wishlist'],
      Tags: ['epic fantasy', 'long read']
    },
    {
      Title: 'Introduction to Algorithms',
      Author: 'Cormen, Leiserson, Rivest, Stein',
      Status: 'Unread',
      IsFavorite: false,
      IsInSeries: false,
      SeriesName: '',
      SeriesNumber: 0,
      BookType: 'Physical',
      PhysicalType: 'Paperback',
      DigitalType: '',
      IsSpecialEdition: false,
      Collections: ['Textbooks', 'Reference'],
      Tags: ['cs', 'study']
    }
  ].map(normalizeBook);
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store.books));
  localStorage.setItem(THEME_KEY, store.theme);
}

function loadBooks() {
  try {
    const rawBooks = localStorage.getItem(STORAGE_KEY);
    const rawTheme = localStorage.getItem(THEME_KEY);
    const parsedBooks = rawBooks ? JSON.parse(rawBooks) : [];
    store.books = Array.isArray(parsedBooks) ? parsedBooks.map(normalizeBook) : [];
    if (rawTheme === 'light' || rawTheme === 'dark') {
      store.theme = rawTheme;
    }
  } catch {
    store.books = [];
  }
}

function setTheme(theme) {
  store.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeIcon();
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

function updateThemeIcon() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  btn.innerHTML = dark
    ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

function mountCommon() {
  loadBooks();
  document.documentElement.setAttribute('data-theme', store.theme);
  updateThemeIcon();

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', toggleTheme);

  document.querySelector('[data-seed]')?.addEventListener('click', () => {
    store.books = seedBooks();
    saveBooks();
    location.reload();
  });

  document.querySelector('[data-export]')?.addEventListener('click', () => {
    downloadJson('library.json', store.books);
  });

  document.querySelector('[data-import-trigger]')?.addEventListener('click', () => {
    document.getElementById('fileInput')?.click();
  });

  document.getElementById('fileInput')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Expected an array of books.');
      store.books = parsed.map(normalizeBook);
      saveBooks();
      location.reload();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }

    e.target.value = '';
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function statusClass(status) {
  return status === 'Read' ? 'status-read' : status === 'Reading' ? 'status-reading' : 'status-unread';
}

function formatDescriptor(book) {
  if (book.BookType === 'Digital') return `Digital - ${book.DigitalType || 'Unknown'}`;
  if (book.PhysicalType === 'Hardback') return `Physical - Hardback - ${book.IsSpecialEdition ? 'Special Edition' : 'Standard Edition'}`;
  return `Physical - ${book.PhysicalType || 'Paperback'}`;
}

function renderSummary(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const total = store.books.length;
  const reading = store.books.filter(b => b.Status === 'Reading').length;
  const read = store.books.filter(b => b.Status === 'Read').length;
  const favorites = store.books.filter(b => b.IsFavorite).length;

  target.innerHTML = [
    ['Total books', total],
    ['Reading now', reading],
    ['Completed', read],
    ['Favorites', favorites]
  ].map(([label, val]) => `
    <article class="stat-card">
      <span class="kicker">${label}</span>
      <strong class="metric">${val}</strong>
    </article>
  `).join('');
}

function renderCollections(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const counts = Object.fromEntries(COLLECTIONS.map(c => [c, 0]));
  store.books.forEach(book => book.Collections.forEach(c => counts[c]++));

  target.innerHTML = COLLECTIONS.map(c => `
    <article class="book-card">
      <span class="kicker">${formatCollectionName(c)}</span>
      <strong class="metric">${counts[c]}</strong>
      <p class="muted">books in this collection</p>
    </article>
  `).join('');
}

function renderBooks(targetId, books) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!books.length) {
    target.innerHTML = '<div class="empty-state"><h3>No books found</h3><p>Add a book or change the current filters.</p></div>';
    return;
  }

  target.innerHTML = books.map(book => {
    const realIndex = store.books.findIndex(item =>
      item.Title === book.Title &&
      item.Author === book.Author &&
      item.SeriesName === book.SeriesName &&
      item.SeriesNumber === book.SeriesNumber &&
      item.BookType === book.BookType
    );

    return `
      <article class="book-card">
        <div style="display:flex;justify-content:space-between;gap:var(--space-3);align-items:start;">
          <div>
            <h3 style="font-size:var(--text-lg);line-height:1.15;margin-bottom:var(--space-1);">${escapeHtml(book.Title)}</h3>
            <p class="muted">${escapeHtml(book.Author)}</p>
          </div>
          ${book.IsFavorite ? '<span class="favorite-badge">Favorite</span>' : ''}
        </div>

        <span class="status-pill ${statusClass(book.Status)}">${book.Status}</span>

        <ul class="meta-list">
          <li><strong>Series:</strong> ${book.IsInSeries ? `${escapeHtml(book.SeriesName)} (Book ${book.SeriesNumber})` : 'None'}</li>
          <li><strong>Format:</strong> ${escapeHtml(formatDescriptor(book))}</li>
        </ul>

        <div class="chips">
          ${book.Collections.length
            ? book.Collections.map(c => `<span class="chip">${formatCollectionName(c)}</span>`).join('')
            : '<span class="chip">No collections</span>'}
        </div>

        <div class="chips">
          ${book.Tags.length
            ? book.Tags.map(tag => `<span class="chip">#${escapeHtml(tag)}</span>`).join('')
            : '<span class="chip">No tags</span>'}
        </div>

        <div class="book-actions">
          <a class="btn btn-ghost" href="./library-add-book.html?edit=${realIndex}">Edit</a>
          <button class="btn btn-secondary" type="button" data-cycle="${realIndex}">Cycle status</button>
          <button class="btn btn-ghost" type="button" data-favorite="${realIndex}">${book.IsFavorite ? 'Unfavorite' : 'Favorite'}</button>
          <button class="btn btn-danger" type="button" data-delete="${realIndex}">Delete</button>
        </div>
      </article>
    `;
  }).join('');

  target.querySelectorAll('[data-cycle]').forEach(btn => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.cycle);
    const current = store.books[i].Status;
    store.books[i].Status = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    saveBooks();
    location.reload();
  }));

  target.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.favorite);
    const book = store.books[i];
    book.IsFavorite = !book.IsFavorite;

    if (book.IsFavorite && !book.Collections.includes('Favorites')) {
      book.Collections.push('Favorites');
    }

    if (!book.IsFavorite) {
      book.Collections = book.Collections.filter(c => c !== 'Favorites');
    }

    saveBooks();
    location.reload();
  }));

  target.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.delete);
    store.books.splice(i, 1);
    saveBooks();
    location.reload();
  }));
}

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

window.LibraryMPA = {
  COLLECTIONS,
  store,
  mountCommon,
  renderSummary,
  renderCollections,
  renderBooks,
  normalizeBook,
  parseTags,
  getQueryParam,
  saveBooks,
  loadBooks,
  formatCollectionName
};