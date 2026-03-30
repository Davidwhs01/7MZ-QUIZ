'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Song, SongCategory, searchSongs } from '@/data/songs';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSelect: (song: Song) => void;
  disabled?: boolean;
  placeholder?: string;
  category?: SongCategory;
}

export default function SearchBar({ onSelect, disabled = false, placeholder = "Digite o nome da música...", category }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const found = searchSongs(q, category);
    setResults(found);
    setIsOpen(found.length > 0);
    setSelectedIndex(-1);
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 150);
  };

  const handleSelect = useCallback((song: Song) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(song);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputContainer}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        {query.length > 0 && (
          <button 
            className={styles.clearBtn}
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {results.map((song, index) => (
            <button
              key={song.id}
              data-item
              className={`${styles.dropdownItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelect(song)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.songTitle}>{song.title}</span>
              {song.anime && (
                <span className={styles.songMeta}>{song.anime}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
