import React, { useState, useEffect, useRef } from 'react';
import { EntryFormData, EntryType, JournalEntry } from '../types';
import { Button } from './Button';

interface EntryFormProps {
  initialData?: JournalEntry;
  onSubmit: (data: EntryFormData) => Promise<void>;
  onCancel: () => void;
}

const SUGGESTED_TAGS = [
  "Productivity", "Philosophy", "Technology", "Science", 
  "History", "Business", "Fiction", "Health", "Design", "Psychology"
];

interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export const EntryForm: React.FC<EntryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<EntryFormData>({
    title: '',
    author: '',
    type: EntryType.BOOK,
    content: '',
    url: '',
    tags: [],
    ai_summary: '',
    cover_image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search State
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author || '',
        type: initialData.type,
        content: initialData.content,
        url: initialData.url || '',
        tags: initialData.tags || [],
        ai_summary: initialData.ai_summary || '',
        cover_image: initialData.cover_image || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Book Search Logic ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, title: val });

    // Only search if type is Book and we have input
    if (formData.type === EntryType.BOOK && val.length > 2) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(val)}&limit=5&fields=key,title,author_name,first_publish_year,cover_i`);
          const data = await response.json();
          setSearchResults(data.docs || []);
          setShowDropdown(true);
        } catch (err) {
          console.error("Error searching books:", err);
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms debounce
    } else {
      setShowDropdown(false);
    }
  };

  const selectBook = (book: BookSearchResult) => {
    const author = book.author_name ? book.author_name[0] : '';
    const coverUrl = book.cover_i 
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` 
      : '';

    setFormData({
      ...formData,
      title: book.title,
      author: author,
      cover_image: coverUrl
    });
    setShowDropdown(false);
  };

  // --- Tag Logic ---
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
        e.currentTarget.value = '';
      }
    }
  };

  const addSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  // --- Markdown Logic ---
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newContent = `${before}${prefix}${selection}${suffix}${after}`;
    
    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selection.length + suffix.length;
      if (start === end) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('_', '_');
    }
  };

  return (
    <div className="bg-white rounded-sm shadow-lg border border-stone-200 p-10 max-w-2xl mx-auto relative">
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 transition-colors"
      >
        ✕
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TOP SECTION: Source Type */}
        <div>
           <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Source Type</label>
           <select
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as EntryType})}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:border-stone-500 text-stone-700 bg-white focus:outline-none focus:ring-0 appearance-none font-sans shadow-sm"
          >
            {Object.values(EntryType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Title & Author (with Search for Books) */}
        <div className="space-y-4 border-b border-stone-100 pb-6 relative">
          <div className="relative">
            <input
              required
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              onFocus={() => formData.type === EntryType.BOOK && searchResults.length > 0 && setShowDropdown(true)}
              className="w-full px-0 py-2 text-3xl font-serif font-bold text-stone-900 placeholder-stone-300 border-none focus:ring-0 focus:outline-none bg-transparent"
              placeholder={formData.type === EntryType.BOOK ? "Search Book Title..." : "Enter Title..."}
              autoComplete="off"
            />
            {isSearching && (
               <div className="absolute right-0 top-4">
                 <svg className="animate-spin h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
               </div>
            )}
            
            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white shadow-xl border border-stone-200 rounded-sm mt-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-widest bg-stone-50 border-b border-stone-100 flex justify-between">
                  <span>Open Library Results</span>
                  <button type="button" onClick={() => setShowDropdown(false)} className="hover:text-stone-700">Close</button>
                </div>
                {searchResults.map((book) => (
                  <div
                    key={book.key}
                    onClick={() => selectBook(book)}
                    className="px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-0 transition-colors"
                  >
                    <div className="font-serif font-bold text-stone-800 text-sm">{book.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {book.author_name?.join(', ')} {book.first_publish_year ? `(${book.first_publish_year})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-serif italic">by</span>
            <input
              type="text"
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
              className="w-full px-0 py-1 text-lg font-serif italic text-stone-600 placeholder-stone-300 border-none focus:ring-0 focus:outline-none bg-transparent"
              placeholder="Author Name"
            />
          </div>
          
          {formData.cover_image && (
             <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-sm border border-stone-100">
                <img src={formData.cover_image} alt="Book Cover" className="h-16 w-10 object-cover shadow-sm border border-stone-200" />
                <div className="text-xs text-stone-500">
                  <p className="font-semibold text-stone-700">Cover Image Selected</p>
                  <button type="button" onClick={() => setFormData({...formData, cover_image: ''})} className="text-red-400 hover:text-red-600 mt-1 hover:underline">Remove</button>
                </div>
             </div>
          )}
        </div>

        {/* Markdown Toolbar */}
        <div className="flex items-center space-x-1 border-b border-stone-100 pb-2">
          <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded" title="Bold (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => insertMarkdown('_', '_')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded italic font-serif" title="Italic (Ctrl+I)">
            I
          </button>
          <div className="w-px h-4 bg-stone-200 mx-1"></div>
          <button type="button" onClick={() => insertMarkdown('# ')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded font-serif" title="Heading">
            H1
          </button>
          <button type="button" onClick={() => insertMarkdown('## ')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded font-serif text-sm" title="Sub-heading">
            H2
          </button>
           <div className="w-px h-4 bg-stone-200 mx-1"></div>
          <button type="button" onClick={() => insertMarkdown('> ')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded" title="Quote">
            ❝
          </button>
          <button type="button" onClick={() => insertMarkdown('- ')} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded" title="Bullet List">
            • List
          </button>
        </div>

        {/* Main Content Area */}
        <div>
          <textarea
            ref={textareaRef}
            required
            rows={12}
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            onKeyDown={handleKeyDown}
            className="w-full px-0 py-2 border-none focus:ring-0 focus:outline-none font-serif text-stone-800 placeholder-stone-300 bg-transparent leading-relaxed text-lg resize-none"
            placeholder="Write your thoughts... Use **bold** or > quotes for styling."
          />
        </div>

        {/* Footer Section: Metadata (URL, Tags) */}
        <div className="pt-6 border-t border-stone-100 space-y-5">
          
          {/* URL Input */}
          <div>
              <input
              type="url"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              className="w-full px-2 py-1.5 text-sm border-b border-stone-200 focus:border-stone-500 text-stone-600 placeholder-stone-300 bg-white focus:outline-none focus:ring-0 font-sans"
              placeholder="Source URL (Optional)"
            />
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tags:</span>
              {formData.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 text-stone-400 hover:text-stone-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                onKeyDown={handleAddTag}
                className="px-2 py-1 text-sm border border-stone-200 rounded-sm focus:border-stone-400 focus:ring-0 text-stone-600 placeholder-stone-400 min-w-[100px] bg-white shadow-sm"
                placeholder="+ Add tag..."
              />
            </div>

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {SUGGESTED_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 6).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  className="text-[10px] px-2 py-0.5 rounded border border-stone-200 text-stone-500 bg-white hover:bg-stone-50 hover:border-stone-300 transition-colors uppercase tracking-wide"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
           <span className="text-xs text-stone-400 font-sans italic">
             {initialData ? 'Editing entry...' : 'New entry...'}
           </span>
           <div className="flex space-x-3">
             <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
             <Button type="submit" isLoading={isSubmitting}>Save to Journal</Button>
           </div>
        </div>

      </form>
    </div>
  );
};