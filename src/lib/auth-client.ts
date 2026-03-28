"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Helper function for validating emails (skipping default form validation)
export const validateEmail = (email: string) => {
  if (!email) { // check for empty field
    return {message: "Please enter an email address to continue", valid: false};
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // check the email structure
    return {message: 'Please enter a valid email address', valid: false};
  }

  return {message: "", valid: true};

}


export const { signIn, signUp, signOut, useSession } = authClient;
