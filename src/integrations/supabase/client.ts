import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { requireEnv } from '@/utils/env';

const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
const SUPABASE_PUBLISHABLE_KEY = requireEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);