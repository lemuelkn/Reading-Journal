# Lumina Journal

Lumina Journal is a personal knowledge management app designed for avid readers. It allows users to log books, articles, and substacks, and uses **Gemini AI** to automatically summarize notes and generate relevant tags.

## Features

*   **User Authentication:** Secure Passwordless Login via Supabase Magic Links.
*   **CRUD Operations:** Create, Read, Update, and Delete journal entries.
*   **AI Integration:** Uses Gemini 2.5 Flash to analyze your reading notes, providing a 1-sentence summary and auto-tags.
*   **Categorization:** Organize by Books, Articles, Substacks, and Research Papers.
*   **Responsive Design:** Optimized for desktop and mobile using Tailwind CSS.

## Technical Documentation

### Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS (via CDN for simplicity in this environment).
*   **Backend:** Supabase (PostgreSQL + Auth).
*   **AI:** Google Gemini API (`gemini-2.5-flash`).
*   **Hosting:** Vercel (Recommended).

### Database Schema (Supabase)

You must create a table named `entries` in your Supabase project.

1. Go to the **SQL Editor** in your Supabase Dashboard.
2. Run the following query to create the table and enable Row Level Security (RLS):

```sql
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  author text,
  type text not null,
  content text not null,
  url text,
  tags text[] default '{}',
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table entries enable row level security;

-- Policy: Users can only see their own entries
create policy "Users can view own entries" 
on entries for select 
using (auth.uid() = user_id);

-- Policy: Users can insert their own entries
create policy "Users can insert own entries" 
on entries for insert 
with check (auth.uid() = user_id);

-- Policy: Users can update their own entries
create policy "Users can update own entries" 
on entries for update 
using (auth.uid() = user_id);

-- Policy: Users can delete their own entries
create policy "Users can delete own entries" 
on entries for delete 
using (auth.uid() = user_id);
```

### Environment Variables

Create a `.env` file in the root directory (or configure in Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
API_KEY=your_google_gemini_api_key
```

*Note: If using Create React App standard scripts, prefix with `REACT_APP_` instead of `NEXT_PUBLIC_`.*

**Troubleshooting:**
If you see the "Configuration Required" screen:
1. Ensure you have created the `.env` file.
2. If hosting on **Vercel**, go to **Settings > Environment Variables** and add the keys there.
3. Ensure you restart your development server after adding new variables.

## Non-Technical Documentation

### How to Use

1.  **Log In:** Enter your email address. You will receive a "Magic Link" in your inbox. Click it to sign in without a password.
2.  **Dashboard:** Once logged in, you will see your "Reading Log". It might be empty at first.
3.  **Adding an Entry:**
    *   Click the **+ New Entry** button.
    *   Select the type (Book, Article, etc.).
    *   Add the title, author, and the URL (optional).
    *   **The Magic Part:** Paste your notes, quotes, or thoughts into the "Notes" section.
    *   Click **✨ Analyze & Tag with Gemini**. The AI will read your notes, generate a short summary, and suggest tags.
    *   **Suggested Tags:** Click on any of the suggested tags to quickly add them.
    *   Click **Save Entry**.
4.  **Reviewing:** You can scroll through your dashboard to see everything you've read. The AI summary helps you quickly recall what a specific article was about without re-reading all your notes.

### Deployment to Vercel

1.  Push this code to a GitHub repository.
2.  Login to Vercel and "Add New Project".
3.  Select your repository.
4.  In the **Environment Variables** section, add the keys mentioned in the Technical section above.
5.  Click **Deploy**.