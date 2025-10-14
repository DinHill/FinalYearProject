'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Building2, Shield, User, Lock, Loader2 } from 'lucide-react';
import { useLogin } from '@/lib/hooks';

export default function LoginPage() {
  const [userId, setUserId] = useState('admin001');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !password.trim()) {
      return;
    }

    loginMutation.mutate(
      { user_id: userId, password },
      {
        onSuccess: () => {
          router.push('/dashboard');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Academic Portal Admin
          </h1>
          <p className="text-gray-600 text-lg">
            University of Greenwich Vietnam
          </p>
          <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            Secure Administrator Access
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in to your administrator account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {loginMutation.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {loginMutation.error.message}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="userId" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  User ID
                </label>
                <Input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="h-12 text-base bg-white text-gray-900 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 text-base pr-12 bg-white text-gray-900 border-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-gray-700">Remember me</span>
                </label>
                <button type="button" className="text-blue-600 hover:text-blue-800 font-medium">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">⚠️ Database is Empty</p>
              <div className="text-sm text-blue-800 space-y-1">
                <p>The database has no users yet. To login, you need to:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Run migrations on production database</li>
                  <li>Create an admin user via API or database</li>
                  <li>Or use the simpler demo credentials if seeded</li>
                </ol>
                <p className="mt-2 font-medium">After seeding, use:</p>
                <div className="mt-1 pl-2">
                  <div><strong>Username:</strong> admin</div>
                  <div><strong>Password:</strong> admin123</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 University of Greenwich Vietnam</p>
          <p className="mt-1">Academic Portal Administration System</p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>🔒 This is a secure area. All access is monitored and logged.</p>
          <p>Only authorized personnel may access this system.</p>
        </div>
      </div>
    </div>
  );
}
