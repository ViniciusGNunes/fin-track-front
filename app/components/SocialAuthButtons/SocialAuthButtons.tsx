"use client";

import React, { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { message } from "antd";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/app/lib/api";
import styles from "./styles.module.scss";

interface SocialAuthButtonsProps {
  text?: "signin_with" | "signup_with" | "continue_with";
}

function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  let str = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = () => {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirectingProvider, setRedirectingProvider] = useState<string | null>(
    null
  );

  // Reset busy states when navigating back via browser history / bfcache
  useEffect(() => {
    const handlePageShow = () => {
      setRedirectingProvider(null);
      setGoogleLoading(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const twitterClientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;

  // Custom Google Login Hook with auth-code flow
  const triggerGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        setGoogleLoading(true);
        const redirectUri = window.location.origin;
        const res = await api.post("/users/google-login", {
          idToken: codeResponse.code,
          code: codeResponse.code,
          redirectUri,
        });

        if (res.data?.token) {
          Cookies.set("X-Access-Token", res.data.token, {
            expires: 7,
            secure: window.location.protocol === "https:",
            sameSite: "lax",
            path: "/",
          });

          message.success(res.data.message || "Autenticado com sucesso!");
          router.push("/dashboard");
        } else {
          message.error("Resposta de autenticação inválida.");
        }
      } catch (error: unknown) {
        console.error("Google login failed:", error);
        const err = error as { response?: { data?: { message?: string } } };
        const msg =
          err?.response?.data?.message || "Falha ao autenticar com o Google.";
        message.error(msg);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      message.error("Falha na autenticação com o Google. Tente novamente.");
    },
  });

  const handleGoogleAuth = () => {
    if (!googleClientId) {
      message.info("Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID no .env para ativar o login com Google.");
      return;
    }
    triggerGoogleLogin();
  };

  const handleGitHubAuth = () => {
    if (!githubClientId) {
      message.info(
        "Configure NEXT_PUBLIC_GITHUB_CLIENT_ID no .env para ativar o login com GitHub."
      );
      return;
    }
    setRedirectingProvider("github");
    const redirectUri = `${window.location.origin}/oauth/callback?provider=github`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=read:user%20user:email`;
    window.location.href = authUrl;
  };

  const handleDiscordAuth = () => {
    if (!discordClientId) {
      message.info(
        "Configure NEXT_PUBLIC_DISCORD_CLIENT_ID no .env para ativar o login com Discord."
      );
      return;
    }
    setRedirectingProvider("discord");
    const redirectUri = `${window.location.origin}/oauth/callback?provider=discord`;
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=identify%20email`;
    window.location.href = authUrl;
  };

  const handleTwitterAuth = async () => {
    if (!twitterClientId) {
      message.info(
        "Configure NEXT_PUBLIC_TWITTER_CLIENT_ID no .env para ativar o login com X (Twitter)."
      );
      return;
    }

    try {
      setRedirectingProvider("twitter");
      const verifier = generateRandomString(64);
      sessionStorage.setItem("fintrack_twitter_verifier", verifier);

      const challengeBuffer = await sha256(verifier);
      const challenge = base64UrlEncode(challengeBuffer);

      const redirectUri = `${window.location.origin}/oauth/callback?provider=twitter`;
      const state = generateRandomString(16);

      const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${twitterClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=users.read%20tweet.read&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;

      window.location.href = authUrl;
    } catch (err) {
      console.error("Twitter PKCE generation error:", err);
      setRedirectingProvider(null);
      message.error("Não foi possível inicializar a autenticação com o X.");
    }
  };

  const isBusy = Boolean(redirectingProvider) || googleLoading;

  return (
    <div className={styles.socialAuthContainer}>
      <div className={styles.oauthGrid}>
        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isBusy}
          className={`${styles.oauthButton} ${styles.googleBtn}`}
          title="Entrar com Google"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          onClick={handleGitHubAuth}
          disabled={isBusy}
          className={`${styles.oauthButton} ${styles.githubBtn}`}
          title="Entrar com GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
        </button>

        {/* Discord Button */}
        <button
          type="button"
          onClick={handleDiscordAuth}
          disabled={isBusy}
          className={`${styles.oauthButton} ${styles.discordBtn}`}
          title="Entrar com Discord"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span>Discord</span>
        </button>

        {/* X / Twitter Button */}
        <button
          type="button"
          onClick={handleTwitterAuth}
          disabled={isBusy}
          className={`${styles.oauthButton} ${styles.twitterBtn}`}
          title="Entrar com X (Twitter)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>X</span>
        </button>
      </div>
    </div>
  );
};

export default SocialAuthButtons;

