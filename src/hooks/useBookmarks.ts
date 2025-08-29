import { useState, useEffect } from 'react';

const BOOKMARKS_KEY = 'vault-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (stored) {
      try {
        setBookmarks(new Set(JSON.parse(stored)));
      } catch {
        setBookmarks(new Set());
      }
    }
  }, []);

  const toggleBookmark = (id: string) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
    } else {
      newBookmarks.add(id);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(newBookmarks)));
  };

  const isBookmarked = (id: string) => bookmarks.has(id);

  const getBookmarkedIds = () => Array.from(bookmarks);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    getBookmarkedIds,
  };
}