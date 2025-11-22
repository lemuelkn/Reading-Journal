import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured, isDemoMode } from './services/supabaseClient';
import { Auth } from './components/Auth';
import { EntryList } from './components/EntryList';
import { EntryForm } from './components/EntryForm';
import { Button } from './components/Button';
import { JournalEntry, EntryFormData } from './types';
import { Session } from '@supabase/supabase-js';

const MOCK_USER_ID = 'demo-user-123';
const LOCAL_STORAGE_KEY = 'lumina_entries';
const LOCAL_SESSION_KEY = 'lumina_demo_session';

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  
  // Search, Filter and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  useEffect(() => {
    // Handle Demo Mode Initialization
    if (isDemoMode) {
      const localSession = localStorage.getItem(LOCAL_SESSION_KEY);
      if (localSession) {
        setSession(JSON.parse(localSession));
        fetchEntries(MOCK_USER_ID);
      }
      setIsLoading(false);
      return;
    }

    // Handle Supabase Initialization
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchEntries(session.user.id);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchEntries(session.user.id);
      } else {
        setEntries([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Compute unique tags from all entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [entries]);

  // Derived state for filtered and sorted entries
  const processedEntries = useMemo(() => {
    let result = [...entries];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(entry => 
        entry.title.toLowerCase().includes(lowerTerm) ||
        entry.content.toLowerCase().includes(lowerTerm) ||
        entry.author?.toLowerCase().includes(lowerTerm) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Tag Filter
    if (selectedTag) {
      result = result.filter(entry => entry.tags?.includes(selectedTag));
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'az':
          return a.title.localeCompare(b.title);
        case 'za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [entries, searchTerm, selectedTag, sortOption]);

  const handleDemoLogin = () => {
    const mockSession = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh',
      user: {
        id: MOCK_USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'demo@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: new Date().toISOString(),
      }
    } as Session;

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockSession));
    setSession(mockSession);
    fetchEntries(MOCK_USER_ID);
  };

  const fetchEntries = async (userId: string) => {
    if (isDemoMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setSession(null);
      setEntries([]);
    } else {
      await supabase.auth.signOut();
    }
  };

  const handleCreateEntry = async (formData: EntryFormData) => {
    if (!session) return;

    if (isDemoMode) {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...formData
      };
      const updatedEntries = [newEntry, ...entries];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setView('list');
      return;
    }

    try {
      const { error } = await supabase.from('entries').insert([
        {
          user_id: session.user.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      
      await fetchEntries(session.user.id);
      setView('list');
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error saving entry');
    }
  };

  const handleUpdateEntry = async (formData: EntryFormData) => {
    if (!session || !editingEntry) return;

    if (isDemoMode) {
      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id 
          ? { ...entry, ...formData, updated_at: new Date().toISOString() }
          : entry
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setEditingEntry(undefined);
      setView('list');
      return;
    }

    try {
      const { error } = await supabase
        .from('entries')
        .update(formData)
        .eq('id', editingEntry.id);

      if (error) throw error;
      
      await fetchEntries(session.user.id);
      setEditingEntry(undefined);
      setView('list');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    
    if (isDemoMode) {
      const updatedEntries = entries.filter(e => e.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      return;
    }

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (session) await fetchEntries(session.user.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setView('edit');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-pulse text-stone-400 font-serif italic">Loading Library...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-stone-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('list')}>
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🕯️</span>
            <h1 className="text-xl font-serif font-bold text-stone-900 hidden sm:block tracking-tight">
              Lumina Journal
            </h1>
            {isDemoMode && <span className="text-[10px] font-sans uppercase tracking-widest border border-amber-200 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full ml-2">Demo</span>}
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-widest hidden sm:block">{session.user.email}</span>
            <Button variant="ghost" onClick={handleLogout} className="text-xs uppercase tracking-wider font-semibold">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {view === 'list' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-stone-200 pb-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Reading Log</h2>
                <p className="text-stone-500 mt-1 font-serif italic">"A room without books is like a body without a soul."</p>
              </div>
              <Button onClick={() => setView('create')} className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">+ New Entry</Button>
            </div>

            {/* Search, Filter and Sort Controls */}
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-sm leading-5 bg-white placeholder-stone-400 focus:outline-none focus:placeholder-stone-500 focus:ring-1 focus:ring-stone-500 focus:border-stone-500 sm:text-sm font-serif"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                {/* Tag Filter */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2.5 text-base border border-stone-200 focus:outline-none focus:ring-stone-500 focus:border-stone-500 sm:text-sm rounded-sm text-stone-800 bg-white font-serif"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>

                {/* Sort Options */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2.5 text-base border border-stone-200 focus:outline-none focus:ring-stone-500 focus:border-stone-500 sm:text-sm rounded-sm text-stone-800 bg-white font-serif"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="az">Title (A-Z)</option>
                  <option value="za">Title (Z-A)</option>
                </select>
              </div>
            </div>

            <EntryList 
              entries={processedEntries} 
              onEdit={startEdit} 
              onDelete={handleDeleteEntry} 
            />
            
            {processedEntries.length === 0 && entries.length > 0 && (
              <div className="text-center py-12">
                 <p className="text-stone-500 font-serif italic">No volumes match your query.</p>
                 <div className="mt-2 space-x-4">
                   <button onClick={() => setSearchTerm('')} className="text-stone-800 hover:underline text-sm font-medium">Clear Search</button>
                   <button onClick={() => setSelectedTag('')} className="text-stone-800 hover:underline text-sm font-medium">Clear Tag Filter</button>
                 </div>
              </div>
            )}
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
             <EntryForm 
               initialData={editingEntry}
               onSubmit={view === 'create' ? handleCreateEntry : handleUpdateEntry}
               onCancel={() => {
                 setView('list');
                 setEditingEntry(undefined);
               }}
             />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
