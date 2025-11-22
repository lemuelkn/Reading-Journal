import React from 'react';
import { JournalEntry, EntryType } from '../types';
import { Button } from './Button';

interface EntryListProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

const TypeBadge: React.FC<{ type: EntryType }> = ({ type }) => {
  const colors = {
    [EntryType.BOOK]: 'bg-amber-50 text-amber-800 border-amber-100',
    [EntryType.ARTICLE]: 'bg-stone-100 text-stone-700 border-stone-200',
    [EntryType.SUBSTACK]: 'bg-orange-50 text-orange-800 border-orange-100',
    [EntryType.PAPER]: 'bg-slate-50 text-slate-700 border-slate-200',
    [EntryType.OTHER]: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold border ${colors[type] || colors[EntryType.OTHER]}`}>
      {type}
    </span>
  );
};

export const EntryList: React.FC<EntryListProps> = ({ entries, onEdit, onDelete }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg border border-stone-200 border-dashed">
        <p className="text-stone-500 mb-2 font-serif italic">No entries found.</p>
        <p className="text-sm text-stone-400">Time to start reading.</p>
      </div>
    );
  }

  return (
    // Increased grid columns for smaller tiles: lg:3, xl:4
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {entries.map(entry => (
        <div key={entry.id} className="group bg-white rounded-sm shadow-sm border border-stone-200 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <TypeBadge type={entry.type} />
            </div>
            
            <h3 className="text-lg font-bold text-stone-900 mb-1 font-serif leading-tight line-clamp-2">
              {entry.title}
            </h3>

            {entry.author && (
              <p className="text-xs text-stone-500 mb-3 font-sans uppercase tracking-wide">
                {entry.author}
              </p>
            )}
            
            <div className="w-8 h-px bg-stone-200 mb-3"></div>

            <p className="text-stone-600 text-sm line-clamp-6 mb-4 whitespace-pre-wrap font-serif flex-grow leading-relaxed">
              {entry.content}
            </p>

            <div className="flex flex-wrap gap-1 mt-auto pt-3">
              {entry.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">#{tag}</span>
              ))}
              {entry.tags && entry.tags.length > 3 && (
                <span className="text-[10px] text-stone-400 px-1.5 py-0.5">+{entry.tags.length - 3}</span>
              )}
            </div>
          </div>
          
          <div className="px-5 py-3 border-t border-stone-100 flex justify-between items-center bg-stone-50/50">
             <span className="text-[10px] text-stone-400 font-sans">
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100" onClick={() => onEdit(entry)}>Edit</button>
              <button className="text-xs text-red-400 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50" onClick={() => onDelete(entry.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};