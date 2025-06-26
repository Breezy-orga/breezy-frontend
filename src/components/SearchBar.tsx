'use client'
import { useState } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Rechercher des tags...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const {t} = useTranslation();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <MdSearch className="absolute left-4 text-gray-500 text-xl" />
        
        {query && (
          <button 
            type="button"
            onClick={clearSearch}
            className="absolute right-12 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MdClose className="text-xl" />
          </button>
        )}
        
        <button
          type="submit"
          className="absolute right-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          {t('search.search')}
        </button>
      </div>
    </form>
  );
}
