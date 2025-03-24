import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/bug';
import { AuthState } from '../types/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialAuthState: AuthState = {
  email: '',
  isVerified: false,
  otpSent: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: 'developer',
          createdAt: session.user.created_at!,
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: 'developer',
          createdAt: session.user.created_at!,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTPEmail = async (email: string, otp: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp },
      });

      if (error) throw error;
      
      // Store OTP in localStorage with expiration
      const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes
      localStorage.setItem('otpData', JSON.stringify({
        otp,
        email,
        expiresAt: expirationTime,
      }));

      setAuthState(prev => ({ ...prev, otpSent: true }));
      toast.info('OTP has been sent to your email');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP');
      throw error;
    }
  };

  const verifyOTP = async (inputOTP: string) => {
    const otpData = localStorage.getItem('otpData');
    if (!otpData) {
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    const { otp, email, expiresAt } = JSON.parse(otpData);
    
    if (Date.now() > expiresAt) {
      localStorage.removeItem('otpData');
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    if (inputOTP === otp) {
      setAuthState(prev => ({ ...prev, isVerified: true }));
      localStorage.removeItem('otpData');
      toast.success('OTP verified successfully!');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const resendOTP = async () => {
    if (!authState.email) {
      toast.error('No email address found');
      return;
    }

    const newOTP = generateOTP();
    await sendOTPEmail(authState.email, newOTP);
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ user_id: data.user.id, role: 'developer' }]);

        if (roleError) {
          console.error('Error setting default role:', roleError);
        }

        setAuthState({ email, isVerified: false, otpSent: false });
        const otp = generateOTP();
        await sendOTPEmail(email, otp);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred during sign up');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setAuthState({ email, isVerified: false, otpSent: false });
      const otp = generateOTP();
      await sendOTPEmail(email, otp);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred during sign in');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthState(initialAuthState);
      toast.success('Successfully signed out!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred during sign out');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authState,
      signIn, 
      signUp, 
      signOut,
      verifyOTP,
      resendOTP
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};