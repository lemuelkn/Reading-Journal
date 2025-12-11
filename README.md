# Lumina Journal

Lumina Journal is a personal knowledge management app designed for avid readers. It allows users to log books, articles, and substacks, and uses **Gemini AI** to automatically summarize notes and generate relevant tags.

## Features

*   **User Authentication:** Secure Passwordless Login via Supabase Magic Links.
*   **CRUD Operations:** Create, Read, Update, and Delete journal entries.
*   **Book Search:** Integrated with Open Library API to auto-fill book titles, authors, and cover images.
*   **Rich Text:** Markdown support for bold, italics, lists, and quotes.
*   **AI Integration:** Uses Gemini 2.5 Flash to analyze your reading notes.
*   **Categorization:** Organize by Books, Articles, Substacks, and Research Papers.
*   **Responsive Design:** Optimized for desktop and mobile using Tailwind CSS.

## Technical Documentation

### Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS (via CDN for simplicity in this environment).
*   **Backend:** Supabase (PostgreSQL + Auth).
*   **AI:** Google Gemini API (`gemini-2.5-flash`).
*   **Hosting:** Vercel.

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
  cover_image text,
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

To run the app locally, create a `.env` file in the root directory.
**Important:** Variables must start with `VITE_` to be visible to the browser application.

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

## Deployment Guide (Vercel)

### 1. Deploy the Code
1.  Push this code to a GitHub repository.
2.  Login to **Vercel** and click **"Add New Project"**.
3.  Import your GitHub repository.
4.  In the **Environment Variables** section, add the keys:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GEMINI_API_KEY`
5.  Click **Deploy**.

### 2. Configure Supabase Redirects (CRITICAL)
For Magic Links to work on your live site, Supabase needs to know your Vercel URL.

1.  Wait for Vercel to finish deploying. Copy your new domain (e.g., `https://lumina-journal.vercel.app`).
2.  Go to your **Supabase Dashboard**.
3.  Navigate to **Authentication** > **URL Configuration**.
4.  In **Site URL**, paste your Vercel domain.
5.  In **Redirect URLs**, add your Vercel domain (e.g., `https://lumina-journal.vercel.app/**`).
6.  Click **Save**.

**Troubleshooting:**

**Error: "Forbidden use of secret API key in browser"**
This happens if you accidentally used the `service_role` (secret) key instead of the `anon` (public) key in your Vercel Environment Variables.
1. Check Vercel Project Settings > Environment Variables.
2. Ensure `VITE_SUPABASE_ANON_KEY` is the `anon` (public) key from Supabase.
