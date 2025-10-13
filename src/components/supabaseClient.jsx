// src/lib/supabaseClient.js
//import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_URL';
const supabaseAnonKey = 'YOUR_ANON_KEY';

//export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// src/components/Scheduler/supabaseClient.jsx

export const supabase = {
  from: (tableName) => ({
    insert: async (data) => {
      console.log(`Pretending to insert into ${tableName}:`, data);
      return {
        data: [{ id: Math.floor(Math.random() * 1000), ...data[0] }],
        error: null
      };
    }
  })
};
