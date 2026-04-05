import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ── Auth Hook ──
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const continueAsGuest = () => {
    setUser({ id: "guest", email: "guest" });
  };

  return { user, loading, signUp, signIn, signOut, resetPassword, signInWithGoogle, continueAsGuest };
}

const isGuest = (userId) => userId === "guest";

// ── Progress Hook ──
export function useProgress(userId) {
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (isGuest(userId)) {
      try { setProgress(JSON.parse(localStorage.getItem("ccc_progress") || "{}")); } catch { /* ignore */ }
      setLoaded(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('task_progress')
        .select('task_id, completed')
        .eq('user_id', userId);
      const map = {};
      (data || []).forEach((r) => { if (r.completed) map[r.task_id] = true; });
      setProgress(map);
      setLoaded(true);
    })();
  }, [userId]);

  const toggleTask = useCallback(async (taskId) => {
    const newVal = !progress[taskId];
    setProgress((p) => {
      const next = { ...p, [taskId]: newVal };
      if (isGuest(userId)) localStorage.setItem("ccc_progress", JSON.stringify(next));
      return next;
    });

    if (!isGuest(userId)) {
      if (newVal) {
        await supabase.from('task_progress').upsert({
          user_id: userId,
          task_id: taskId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,task_id' });
      } else {
        await supabase.from('task_progress')
          .update({ completed: false, completed_at: null, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('task_id', taskId);
      }
    }
  }, [userId, progress]);

  return { progress, loaded, toggleTask };
}

// ── Notes Hook ──
export function useNotes(userId) {
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (!userId) return;
    if (isGuest(userId)) {
      try { setNotes(JSON.parse(localStorage.getItem("ccc_notes") || "{}")); } catch { /* ignore */ }
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('task_notes')
        .select('task_id, content')
        .eq('user_id', userId);
      const map = {};
      (data || []).forEach((r) => { if (r.content) map[r.task_id] = r.content; });
      setNotes(map);
    })();
  }, [userId]);

  const updateNote = useCallback(async (taskId, content) => {
    setNotes((n) => {
      const next = { ...n, [taskId]: content };
      if (isGuest(userId)) localStorage.setItem("ccc_notes", JSON.stringify(next));
      return next;
    });
    if (!isGuest(userId)) {
      await supabase.from('task_notes').upsert({
        user_id: userId,
        task_id: taskId,
        content,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id' });
    }
  }, [userId]);

  return { notes, updateNote };
}

// ── Study Sessions Hook ──
export function useSessions(userId) {
  const [logs, setLogs] = useState({});

  useEffect(() => {
    if (!userId) return;
    if (isGuest(userId)) {
      try { setLogs(JSON.parse(localStorage.getItem("ccc_sessions") || "{}")); } catch { /* ignore */ }
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('label, duration_seconds, session_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      const map = {};
      (data || []).forEach((r) => {
        const key = r.session_date;
        if (!map[key]) map[key] = [];
        map[key].push({ label: r.label, duration: r.duration_seconds });
      });
      setLogs(map);
    })();
  }, [userId]);

  const addSession = useCallback(async (session) => {
    setLogs((prev) => {
      const day = prev[session.date] || [];
      const next = { ...prev, [session.date]: [{ label: session.label, duration: session.duration }, ...day] };
      if (isGuest(userId)) localStorage.setItem("ccc_sessions", JSON.stringify(next));
      return next;
    });

    if (!isGuest(userId)) {
      await supabase.from('study_sessions').insert({
        user_id: userId,
        label: session.label,
        duration_seconds: session.duration,
        session_date: session.date,
      });
    }
  }, [userId]);

  return { logs, addSession };
}
