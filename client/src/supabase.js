import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://irfrbqjznkkxmjwmizxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7O4qTFDp4G63-k3F0sJK6A__WQGe8EI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
