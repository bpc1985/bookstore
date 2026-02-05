'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema } from '@/lib/schemas';
import { useRegisterMutation } from '@/lib/hooks';
import { toast } from 'sonner';
import AuthGuard from '@/components/middleware/AuthGuard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await registerMutation.mutateAsync(value);
        toast.success('Account created successfully!');
        router.push('/');
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  return (
    <AuthGuard requireAuth={false}>
      <div className="container flex items-center justify-center min-h-[80vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field name="fullName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0].message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0].message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="password">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0].message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-destructive">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0].message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <GoogleSignInButton variant="signup" />
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
