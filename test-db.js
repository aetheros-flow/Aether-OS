import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('UserWheel').select('*').limit(1);
    if (error) {
        console.error("Error fetching", error);
    } else {
        if (data.length > 0) {
           console.log("Columns:", Object.keys(data[0]));
        } else {
           console.log("No data, try to fetch schema via error");
           const { error: e2 } = await supabase.from('UserWheel').update({ 'fake_col': 1 }).eq('id', '1');
           console.log(e2);
        }
    }
}
test();
