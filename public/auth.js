import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://invcqaevxlcziiqzuhxw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmNxYWV2eGxjemlpcXp1aHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Nzg3MDksImV4cCI6MjA4OTE1NDcwOX0.Y-9a1s6w8dtSJwOa3A34qY3Q6QeEPyL7tRqFuoxjXMQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}