import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'student' | 'teacher';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, username: string, role: 'student' | 'teacher') => Promise<'student' | 'teacher'>;
  signIn: (identifier: string, password: string) => Promise<'student' | 'teacher'>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      console.log('Checking session...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session result:', session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
          }

          console.log('Profile loaded:', data);
          setProfile(data);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // No establecemos un error global aquí para evitar bloquear la aplicación.
        // Simplemente permitimos que loading sea false para que el usuario vea la pantalla de Login.
      } finally {
        console.log('Session check finished. Loading set to false.');
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string, role: 'student' | 'teacher') => {
    try {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Por favor ingresa un email válido');
      }

      // Validar contraseña
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const cleanEmail = email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado');
        }
        if (authError.message.includes('invalid email')) {
          throw new Error('El formato del correo electrónico es inválido');
        }
        if (authError.message.includes('password')) {
          throw new Error('La contraseña no cumple con los requisitos de seguridad');
        }
        throw new Error('Error al registrarse: ' + authError.message);
      }

      if (authData.user) {
        const userId = authData.user.id;
        // Create profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: cleanEmail,
              username,
              role,
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Error al crear el perfil: ' + profileError.message);
        }

        // Actualizar el estado global inmediatamente para que la redirección funcione
        setUser(authData.user);
        setProfile(profileData);
      }
      return role;
    } catch (err) {
      throw err;
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      const trimmedIdentifier = identifier.trim();
      let email = trimmedIdentifier;

      if (!trimmedIdentifier.includes('@')) {
        const lookupName = trimmedIdentifier.trim();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', lookupName)
          .single();

        if (profileError || !profile) {
          throw new Error('El usuario no existe');
        }

        email = profile.email;
      } else {
        email = trimmedIdentifier.toLowerCase();
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Contraseña incorrecta o usuario inexistente');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('El correo electrónico no ha sido confirmado');
        }
        throw new Error('Error al iniciar sesión. Por favor, verifique sus datos');
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError) {
          throw new Error('Sesión iniciada, pero no se encontró tu perfil de usuario.');
        }

        setUser(authData.user);
        setProfile(profileData);
        return profileData?.role ?? 'student';
      }
      
      throw new Error('No se pudo obtener la sesión del usuario.');
    } catch (err) {
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No hay usuario autenticado');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err) {
        setError('Error durante el cierre de sesión: ' + (err instanceof Error ? err.message : 'Unknown error'));
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
