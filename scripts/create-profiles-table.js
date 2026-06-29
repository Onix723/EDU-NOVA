import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function createProfilesTable() {
  try {
    console.log('Creating profiles table...');
    
    const { data, error } = await supabase.rpc('postgres', {
      query: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          role TEXT CHECK (role IN ('student', 'teacher')),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Allow users to insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      `
    });
    
    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }
    
    console.log('✅ Profiles table created successfully!');
    console.log('Response:', data);
  } catch (err) {
    console.error('Exception:', err);
    process.exit(1);
  }
}

createProfilesTable();
