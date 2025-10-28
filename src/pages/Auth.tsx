import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '@/assets/AdviserGPT-logo.svg?react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = login(email, password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/');
      } else {
        toast({
          title: "Login failed",
          description: "Please check your email format and ensure password is not empty.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-16">
          <Logo className="h-12 w-auto" />
        </div>
        
        <Card className="bg-background">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your AdviserGPT account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-white/80 border border-foreground/30 backdrop-blur-sm transition focus:border-sidebar-primary focus-within:border-sidebar-primary focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/80 border border-foreground/30 backdrop-blur-sm transition focus:border-sidebar-primary focus-within:border-sidebar-primary focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Log In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link 
                to="/reset-password" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset password
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
