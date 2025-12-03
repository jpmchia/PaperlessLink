"use client";

import React, { useState } from "react";
import { Button } from "@/ui/components/Button";
import { LinkButton } from "@/ui/components/LinkButton";
import { TextField } from "@/ui/components/TextField";
import { useAuth } from "@/lib/api/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!username || !password) {
      setFormError("Please enter both username and password");
      return;
    }

    try {
      await login({
        username: username,
        password: password,
      });
      // Redirect happens in the hook
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="flex w-full items-start h-screen">
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch">
        <img
          className="w-full grow shrink-0 basis-0 object-cover"
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=1200&fit=crop"
          alt="Sign in background"
        />
      </div>
      <div className="flex max-w-[448px] grow shrink-0 basis-0 flex-col items-center justify-center gap-8 self-stretch bg-default-background px-12 py-12">
        <div className="flex w-full flex-col items-start gap-8">
          <div className="flex w-full flex-col items-start gap-2">
            <span className="w-full text-heading-1 font-heading-1 text-default-font">
              Welcome back
            </span>
            <span className="w-full text-body font-body text-subtext-color">
              Sign in to your account to continue
            </span>
          </div>

          {formError && (
            <div className="w-full rounded-md bg-error-50 border border-error-200 px-4 py-3">
              <span className="text-body font-body text-error-600">
                {formError}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col items-start gap-6"
          >
            <TextField
              className="h-auto w-full flex-none"
              label="Username"
              helpText=""
            >
              <TextField.Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setUsername(event.target.value);
                }}
                required
                disabled={loading}
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label="Password"
              helpText=""
            >
              <TextField.Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(event.target.value);
                }}
                required
                disabled={loading}
              />
            </TextField>
            <Button
              className="h-10 w-full flex-none"
              size="large"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex w-full items-start justify-center gap-1 flex-wrap">
            <span className="text-body font-body text-default-font">
              Don&apos;t have an account?
            </span>
            <LinkButton
              variant="brand"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                // TODO: Navigate to sign up page when it exists
                router.push("/signup");
              }}
            >
              Sign up
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

