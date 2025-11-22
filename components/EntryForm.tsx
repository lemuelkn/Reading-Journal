import React, { useState, useEffect } from 'react';
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

export const EntryForm: React.FC<EntryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<EntryFormData>({
    title: '',
    author: '',
    type: EntryType.BOOK,
    content: '',
    url: '',
    tags: [],
    ai_summary: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author || '',
        type: initialData.type,
        content: initialData.content,
        url: initialData.url || '',
        tags: initialData.tags || [],
        ai_summary: initialData.ai_summary || ''
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

  return (
    <div className="bg-white rounded-sm shadow-lg border border-stone-200 p-10 max-w-2xl mx-auto relative">
      {/* Close button for a modal-like feel */}
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 transition-colors"
      >
        ✕
      </button>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header Section: Title & Author */}
        <div className="space-y-2 border-b border-stone-100 pb-6">
          <input
            required
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-0 py-2 text-3xl font-serif font-bold text-stone-900 placeholder-stone-300 border-none focus:ring-0 focus:outline-none bg-transparent"
            placeholder="Enter Title..."
          />
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
        </div>

        {/* Main Content Area */}
        <div>
          <textarea
            required
            rows={12}
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            className="w-full px-0 py-0 border-none focus:ring-0 focus:outline-none font-serif text-stone-800 placeholder-stone-300 bg-transparent leading-relaxed text-lg resize-none"
            placeholder="Write your thoughts, quotes, or summary here..."
          />
        </div>

        {/* Footer Section: Metadata (Type, URL, Tags) */}
        <div className="pt-6 border-t border-stone-100 space-y-5">
          
          {/* Type & URL Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as EntryType})}
                className="w-full px-2 py-1.5 text-sm border-b border-stone-200 focus:border-stone-500 text-stone-600 bg-transparent focus:outline-none focus:ring-0 appearance-none font-sans"
              >
                {Object.values(EntryType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
               <input
                type="url"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="w-full px-2 py-1.5 text-sm border-b border-stone-200 focus:border-stone-500 text-stone-600 placeholder-stone-300 bg-transparent focus:outline-none focus:ring-0 font-sans"
                placeholder="Source URL (Optional)"
              />
            </div>
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

            {/* Subtle Suggested Tags */}
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
