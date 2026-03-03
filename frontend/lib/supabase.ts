/**
 * NeuraSight Supabase Client
 * ===========================
 * Client configuration for Supabase persistence.
 * 
 * Setup Instructions:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 * 4. Run the SQL from backend/api/supabase_setup.sql in Supabase SQL Editor
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing environment variables. Persistence will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Profile {
  id: string;
  user_id: string;
  last_connected_sheet_id: string | null;
  persona_preference: string;
  audio_muted: boolean;
  ghost_state?: Record<string, unknown> | null; // Agent 8: Persistence Warden - Ghost State
  created_at: string;
  updated_at: string;
}

/**
 * Get or create user profile using upsert
 * Uses user_id (TEXT) as the conflict key, not id (UUID)
 * Falls back to localStorage if Supabase fails (Sovereign Cache)
 */
const STORAGE_KEY = 'neurasight_profile_cache';

function getCachedProfile(userId: string): Profile | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Add required fields if missing
      return {
        id: parsed.id || `local_${userId}`,
        user_id: userId,
        last_connected_sheet_id: parsed.last_connected_sheet_id || null,
        persona_preference: parsed.persona_preference || 'CEO',
        audio_muted: parsed.audio_muted !== undefined ? parsed.audio_muted : true,
        ghost_state: parsed.ghost_state || null,
        created_at: parsed.created_at || new Date().toISOString(),
        updated_at: parsed.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[Supabase] Error reading localStorage cache:', err);
  }
  return null;
}

function setCachedProfile(userId: string, profile: Partial<Profile>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached = getCachedProfile(userId) || {
      id: `local_${userId}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const updated = {
      ...cached,
      ...profile,
      updated_at: new Date().toISOString(),
    };
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Supabase] Error writing to localStorage cache:', err);
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  // Always ensure userId matches current session (perfect matching)
  const sessionUserId = userId.trim();
  
  // Try localStorage first for instant response (Zero-Failure logic)
  const cached = getCachedProfile(sessionUserId);
  if (cached && cached.user_id === sessionUserId) {
    // Return cached immediately, then sync in background
    if (supabase) {
      // Background sync (fire and forget)
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionUserId)
        .single();
      
      // Handle promise properly - ensure it's a thenable Promise
      Promise.resolve(queryPromise)
        .then((result: { data: unknown; error: unknown }) => {
          const { data, error } = result;
          if (!error && data) {
            // Update cache with fresh data
            setCachedProfile(sessionUserId, data);
          }
        })
        .catch(() => {
          // Silently fail background sync
        });
    }
    return cached;
  }

  // Try Supabase for fresh data or initial creation
  if (supabase) {
    try {
      // First, try to get existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionUserId)
        .single();

      if (existing && !fetchError) {
        // Sync to localStorage cache
        setCachedProfile(sessionUserId, existing);
        return existing;
      }

      // If doesn't exist, try to insert new profile
      const insertData = {
        user_id: sessionUserId,
        persona_preference: 'CEO',
        audio_muted: true,
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      // Check for empty error {} - immediate fallback
      if (insertError) {
        const errorString = JSON.stringify(insertError);
        const isEmptyError = errorString === '{}' || (!insertError.message && !insertError.code);
        
        if (isEmptyError || !newData) {
          // Immediate fallback to localStorage on empty error
          console.warn('[Supabase] Empty error or failed insert, using localStorage immediately');
          const newCached: Profile = {
            id: `local_${sessionUserId}`,
            user_id: sessionUserId,
            last_connected_sheet_id: null,
            persona_preference: 'CEO',
            audio_muted: true,
            ghost_state: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCachedProfile(sessionUserId, newCached);
          return newCached;
        }
      }

      if (newData) {
        // Sync to localStorage cache
        setCachedProfile(sessionUserId, newData);
        return newData;
      }
    } catch (err) {
      console.error('[Supabase] Unexpected error, using localStorage:', err);
    }
  }

  // Final fallback to localStorage (Sovereign Cache)
  const finalCached = getCachedProfile(sessionUserId);
  if (finalCached) {
    return finalCached;
  }

  // Create new cached profile
  const newCached: Profile = {
    id: `local_${sessionUserId}`,
    user_id: sessionUserId,
    last_connected_sheet_id: null,
    persona_preference: 'CEO',
    audio_muted: true,
    ghost_state: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  setCachedProfile(sessionUserId, newCached);
  return newCached;
}

/**
 * Update user profile using upsert (creates if doesn't exist)
 * Uses user_id (TEXT) as the conflict key, not id (UUID)
 * Falls back to localStorage if Supabase fails (Sovereign Cache)
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'last_connected_sheet_id' | 'persona_preference' | 'audio_muted' | 'ghost_state'>>
): Promise<boolean> {
  // Ensure userId matches perfectly
  const sessionUserId = userId.trim();
  
  // Always update localStorage cache immediately (Zero-Failure)
  setCachedProfile(sessionUserId, updates);

  // Try Supabase update in background (fire and forget for resilience)
  if (supabase) {
    // Use setTimeout to make it truly async/background
    setTimeout(async () => {
      try {
        // Check if profile exists
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', sessionUserId)
          .single();

        if (existing) {
          // Update existing profile
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', sessionUserId);

          if (!error) {
            // Sync success back to localStorage
            const { data: updated } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', sessionUserId)
              .single();
            if (updated) {
              setCachedProfile(sessionUserId, updated);
            }
          } else {
            // Silent failure - localStorage already has the update
            const errorString = JSON.stringify(error);
            if (errorString !== '{}') {
              console.warn('[Supabase] Background sync failed (localStorage has latest):', error);
            }
          }
        } else {
          // Try to insert (with error handling for empty errors)
          const insertData = {
            user_id: sessionUserId,
            persona_preference: updates.persona_preference || 'CEO',
            audio_muted: updates.audio_muted !== undefined ? updates.audio_muted : true,
            ...updates,
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(insertData);

          if (insertError) {
            const errorString = JSON.stringify(insertError);
            const isEmptyError = errorString === '{}' || (!insertError.message && !insertError.code);
            if (!isEmptyError) {
              console.warn('[Supabase] Background insert failed (localStorage has latest):', insertError);
            }
          }
        }
      } catch (err) {
        // Silent background failure - localStorage already has the update
        console.warn('[Supabase] Background sync error (localStorage has latest):', err);
      }
    }, 0);
  }

  // Always return true immediately (localStorage was updated)
  return true;
}

/**
 * Update user profile with additional fields (spreadsheetId, persona, industry)
 * Enhanced version for saving dashboard connection state
 */
export async function updateUserProfile(
  userId: string,
  data: {
    spreadsheetId?: string | null;
    persona?: string;
    industry?: string;
  }
): Promise<boolean> {
  const sessionUserId = userId.trim();

  // Map to profile fields
  const updates: Partial<Profile> = {};
  
  if (data.spreadsheetId !== undefined) {
    updates.last_connected_sheet_id = data.spreadsheetId;
  }
  
  if (data.persona !== undefined) {
    updates.persona_preference = data.persona;
  }
  
  // Industry would need to be added to Profile interface or stored in ghost_state
  // For now, store industry in ghost_state if provided
  if (data.industry !== undefined) {
    const currentProfile = await getProfile(sessionUserId);
    const currentGhostState = currentProfile?.ghost_state || {};
    updates.ghost_state = {
      ...currentGhostState,
      industry: data.industry,
    };
  }

  // Use existing updateProfile function
  return await updateProfile(sessionUserId, updates);
}

