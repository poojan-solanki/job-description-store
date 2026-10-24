'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loginAction, registerAction } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Briefcase, Lock, User, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export function AuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please provide both username and password.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'login') {
        const res = await loginAction({ username, password });
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in');
          toast.error(res.error || 'Invalid credentials');
        } else {
          toast.success(`Welcome back, ${res.user?.username}!`);
          router.refresh();
        }
      } else {
        const res = await registerAction({ username, password });
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to register');
          toast.error(res.error || 'Registration failed');
        } else {
          toast.success(`Account created! Welcome, ${res.user?.username}!`);
          router.refresh();
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      toast.error('Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative font-sans">
      <div className="absolute top-5 right-5">
        <ThemeToggle className="h-10 w-10" />
      </div>

      {/* Brand Header */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs ring-1 ring-primary/20">
          <Briefcase className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl font-heading">
          Job Description Store
        </h1>
        <p className="mt-2.5 text-base text-muted-foreground leading-relaxed">
          Save, manage, and instantly find company job descriptions in one private workspace.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-md border-border/80 rounded-2xl">
        <CardHeader className="pb-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as 'login' | 'register');
              setErrorMsg('');
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 rounded-xl">
              <TabsTrigger value="login" className="text-sm font-semibold rounded-lg">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="text-sm font-semibold rounded-lg">Create Account</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-1">
            <div>
              <CardTitle className="text-xl font-bold font-heading">
                {activeTab === 'login' ? 'Sign into your store' : 'Create your personal store'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {activeTab === 'login'
                  ? 'Access your private company JDs and applications.'
                  : 'Your account keeps your saved company JDs private and isolated.'}
              </CardDescription>
            </div>

            {errorMsg && (
              <div className="p-3.5 text-sm rounded-xl bg-destructive/15 text-destructive font-medium border border-destructive/20 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. alex_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 text-base sm:text-sm rounded-xl"
                  required
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={activeTab === 'register' ? 'At least 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 text-base sm:text-sm rounded-xl"
                  required
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 text-xs sm:text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Session stored in secure <strong>httpOnly</strong> cookie. Stays signed in on reload.</span>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full gap-2 h-12 text-base font-semibold rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
