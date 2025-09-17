import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Apple,
  ArrowLeft,
  Bell,
  Check,
  ChefHat,
  Leaf,
  Loader,
  MapPin,
  Moon,
  Upload,
  Wheat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FuzoButton } from "./global/FuzoButton";
import { FuzoInput } from "./global/FuzoInput";
// import { GoogleSignInButton } from './debug/oauth/GoogleSignInButton'; // Moved to debug folder
// import { useAuth } from '../contexts/AuthContext'; // Temporarily disabled

interface OnboardingFlowProps {
  onComplete?: () => void;
  onBack?: () => void;
}

type OnboardingStep =
  | "splash"
  | "auth"
  | "profile"
  | "cuisine"
  | "dietary"
  | "location"
  | "notifications"
  | "success";

interface UserData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  bio: string;
  avatar?: string;
  cuisines: string[];
  dietary: string[];
  locationEnabled: boolean;
  notificationsEnabled: boolean;
}

const cuisineOptions = [
  { id: "italian", name: "Italian", emoji: "🍝" },
  { id: "indian", name: "Indian", emoji: "🍛" },
  { id: "japanese", name: "Japanese", emoji: "🍣" },
  { id: "mexican", name: "Mexican", emoji: "🌮" },
  { id: "chinese", name: "Chinese", emoji: "🥟" },
  { id: "thai", name: "Thai", emoji: "🍜" },
  { id: "mediterranean", name: "Mediterranean", emoji: "🥗" },
  { id: "american", name: "American", emoji: "🍔" },
];

const dietaryOptions = [
  { id: "none", name: "No restrictions", icon: Check },
  { id: "vegetarian", name: "Vegetarian", icon: Leaf },
  { id: "vegan", name: "Vegan", icon: Apple },
  { id: "gluten-free", name: "Gluten-free", icon: Wheat },
  { id: "dairy-free", name: "Dairy-free", icon: Moon },
  { id: "keto", name: "Keto", icon: ChefHat },
];

const DUMMY_CREDENTIALS = {
  email: "juncando@gmail.com",
  password: "fuzo123",
};

export function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [userData, setUserData] = useState<UserData>({
    email: "",
    password: "",
    fullName: "",
    username: "",
    bio: "",
    cuisines: [],
    dietary: [],
    locationEnabled: false,
    notificationsEnabled: false,
  });
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Supabase client for OAuth
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Real Google OAuth sign-in
  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Supabase will redirect, so no further action needed here
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setIsSigningIn(false);
    }
  };
  const loading = false;

  // Note: Authentication auto-advance is now handled directly in handleAuth() for demo purposes

  // Handle onboarding completion when reaching the final step
  useEffect(() => {
    if (currentStep === "success" && onComplete) {
      console.log("🎉 Onboarding completed, calling onComplete");
      // Small delay to show success screen briefly
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  // Auto-advance from splash screen
  useEffect(() => {
    if (currentStep === "splash") {
      const timer = setTimeout(() => {
        setCurrentStep("auth");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Handle Google sign-in success

  const handleAuth = async () => {
    if (!userData.email || !userData.password) {
      alert("Please fill in all fields");
      return;
    }

    setError(null);

    if (isLogin) {
      // Login flow
      if (
        userData.email === DUMMY_CREDENTIALS.email &&
        userData.password === DUMMY_CREDENTIALS.password
      ) {
        console.log("✅ Dummy credentials detected, using mock authentication");
        console.log("🚀 Mock login successful - advancing to profile setup");
        // For demo purposes, directly advance to the next step
        setCurrentStep("profile");
        return;
      } else {
        // Real login with Supabase (disabled for now)
        console.log("🚀 Real authentication disabled - use demo credentials");
        setError("Please use demo credentials: juncando@gmail.com / fuzo123");
        return;
      }
    } else {
      // Signup flow - for demo, just advance to profile
      console.log("🚀 Demo signup - advancing to profile setup");
      setCurrentStep("profile");
      return;
    }
  };

  const nextStep = () => {
    const steps: OnboardingStep[] = [
      "splash",
      "auth",
      "profile",
      "cuisine",
      "dietary",
      "location",
      "notifications",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = [
      "splash",
      "auth",
      "profile",
      "cuisine",
      "dietary",
      "location",
      "notifications",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 1) {
      setCurrentStep(steps[currentIndex - 1]);
    } else if (currentIndex === 1 && onBack) {
      onBack();
    }
  };

  const toggleCuisine = (cuisineId: string) => {
    setUserData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisineId)
        ? prev.cuisines.filter((id) => id !== cuisineId)
        : [...prev.cuisines, cuisineId],
    }));
  };

  const toggleDietary = (dietaryId: string) => {
    setUserData((prev) => ({
      ...prev,
      dietary:
        dietaryId === "none"
          ? ["none"]
          : prev.dietary.includes(dietaryId)
          ? prev.dietary.filter((id) => id !== dietaryId)
          : [...prev.dietary.filter((id) => id !== "none"), dietaryId],
    }));
  };

  const renderTakoMascot = (
    pose: "waving" | "map" | "bell" | "celebration"
  ) => {
    const takoEmojis = {
      waving: "👋",
      map: "🗺️",
      bell: "🔔",
      celebration: "🎉",
    };

    return (
      <motion.div
        style={{
          width: "96px",
          height: "96px",
          backgroundColor: "var(--fuzo-coral)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span style={{ color: "var(--fuzo-white)" }}>🐙</span>
        <span
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            fontSize: "1.5rem",
          }}
        >
          {takoEmojis[pose]}
        </span>
      </motion.div>
    );
  };

  const pageTransition = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3, ease: "easeInOut" },
  };

  const getStepProgress = () => {
    const steps: OnboardingStep[] = [
      "splash",
      "auth",
      "profile",
      "cuisine",
      "dietary",
      "location",
      "notifications",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);
    return {
      current: currentIndex + 1,
      total: steps.length,
      percentage: ((currentIndex + 1) / steps.length) * 100,
    };
  };

  const renderProgressBar = () => {
    const progress = getStepProgress();

    if (currentStep === "splash" || currentStep === "success") {
      return null;
    }

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            height: "4px",
            backgroundColor: "#E5E7EB",
          }}
        >
          <motion.div
            style={{
              height: "100%",
              backgroundColor: "var(--fuzo-coral)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {renderProgressBar()}
      <AnimatePresence mode="wait">
        {/* Screen 1: Splash/Welcome */}
        {currentStep === "splash" && (
          <motion.div
            key="splash"
            {...pageTransition}
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-[var(--fuzo-orange-brown)] text-primary-foreground px-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <div className="w-32 h-32 mx-auto mb-8 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                <span className="text-5xl font-bold text-primary-foreground">
                  F
                </span>
              </div>

              <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-4">FUZO</h1>
                <p className="text-xl text-white/90">
                  Discover food, near &amp; far.
                </p>
              </div>

              {renderTakoMascot("waving")}

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex justify-center gap-2 pt-8"
              >
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Screen 2: Sign Up/Login */}
        {currentStep === "auth" && (
          <motion.div
            key="auth"
            {...pageTransition}
            style={{
              minHeight: "100vh",
              backgroundColor: "var(--fuzo-white)",
              padding: "32px 24px",
            }}
          >
            <div style={{ maxWidth: "448px", margin: "0 auto" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "32px",
                }}
              >
                <button
                  onClick={onBack}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "var(--fuzo-navy)",
                    }}
                  />
                </button>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "var(--fuzo-coral)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      color: "var(--fuzo-white)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.25rem",
                    }}
                  >
                    F
                  </span>
                </div>
                <div style={{ width: "40px" }}></div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h1
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--fuzo-navy)",
                    marginBottom: "8px",
                  }}
                >
                  Join FUZO
                </h1>
                <p style={{ color: "#6B7280" }}>
                  Welcome to your food adventure
                </p>
                {isLogin && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "rgba(255, 215, 74, 0.2)",
                      borderRadius: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--fuzo-orange-brown)",
                      }}
                    >
                      <strong>Demo:</strong> Use juncando@gmail.com / fuzo123
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginBottom: "24px",
                    padding: "16px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <AlertCircle
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "#EF4444",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: "#B91C1C",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Sign-in Error
                    </p>
                    <p
                      style={{
                        color: "#DC2626",
                        fontSize: "0.875rem",
                      }}
                    >
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {loading || isSigningIn ? (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: "48px",
                    paddingBottom: "48px",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "var(--fuzo-coral)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px auto",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <Loader
                      style={{
                        width: "32px",
                        height: "32px",
                        color: "var(--fuzo-white)",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  </div>
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--fuzo-navy)",
                      marginBottom: "8px",
                    }}
                  >
                    {isSigningIn ? "Signing you in..." : "Loading..."}
                  </h2>
                  <p style={{ color: "#6B7280" }}>
                    {isSigningIn ? "Redirecting to Google..." : "Please wait"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Auth Toggle */}
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "#F3F4F6",
                      borderRadius: "12px",
                      padding: "4px",
                      marginBottom: "32px",
                    }}
                  >
                    <button
                      onClick={() => setIsLogin(false)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontWeight: "var(--font-weight-medium)",
                        transition: "all 0.2s ease",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: !isLogin
                          ? "var(--fuzo-white)"
                          : "transparent",
                        color: !isLogin ? "var(--fuzo-navy)" : "#6B7280",
                        boxShadow: !isLogin
                          ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                          : "none",
                      }}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => setIsLogin(true)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontWeight: "var(--font-weight-medium)",
                        transition: "all 0.2s ease",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isLogin
                          ? "var(--fuzo-white)"
                          : "transparent",
                        color: isLogin ? "var(--fuzo-navy)" : "#6B7280",
                        boxShadow: isLogin
                          ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                          : "none",
                      }}
                    >
                      Login
                    </button>
                  </div>

                  {/* Google Sign-in (Primary) */}
                  <div style={{ marginBottom: "24px" }}>
                    <button
                      onClick={signInWithGoogle}
                      disabled={loading || isSigningIn}
                      style={{
                        width: "100%",
                        backgroundColor: "var(--fuzo-white)",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        color: "#374151",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease",
                        opacity: loading || isSigningIn ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && !isSigningIn) {
                          (
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "#F9FAFB";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading && !isSigningIn) {
                          (
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "var(--fuzo-white)";
                        }
                      }}
                    >
                      <svg
                        style={{ width: "20px", height: "20px" }}
                        viewBox="0 0 24 24"
                      >
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
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {isSigningIn ? "Signing in..." : "Continue with Google"}
                    </button>
                  </div>

                  {/* OR Divider */}
                  <div
                    style={{
                      position: "relative",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          borderTop: "1px solid #E5E7EB",
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "var(--fuzo-white)",
                          padding: "0 16px",
                          fontSize: "0.875rem",
                          color: "#6B7280",
                        }}
                      >
                        Or {isLogin ? "login" : "sign up"} with email
                      </span>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="max-w-md mx-auto space-y-6 mb-6">
                    <FuzoInput
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      value={userData.email}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="rounded-lg max-w-md mx-auto"
                    />
                    <FuzoInput
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      value={userData.password}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="rounded-lg max-w-md mx-auto"
                    />
                  </div>

                  <div className="max-w-md mx-auto mb-8">
                    <FuzoButton
                      variant="secondary"
                      size="lg"
                      onClick={handleAuth}
                      className="rounded-lg max-w-md w-full mx-auto"
                    >
                      {isLogin ? "Login" : "Continue"}
                    </FuzoButton>
                  </div>

                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      textAlign: "center",
                    }}
                  >
                    By continuing, you agree to our{" "}
                    <button
                      style={{
                        color: "var(--fuzo-coral)",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Terms
                    </button>{" "}
                    &{" "}
                    <button
                      style={{
                        color: "var(--fuzo-coral)",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Privacy Policy
                    </button>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Screen 3: Profile Setup */}
        {currentStep === "profile" && (
          <motion.div
            key="profile"
            {...pageTransition}
            style={{
              minHeight: "100vh",
              backgroundColor: "var(--fuzo-white)",
              padding: "32px 24px",
            }}
          >
            <div style={{ maxWidth: "448px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "32px",
                }}
              >
                <button
                  onClick={prevStep}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "var(--fuzo-navy)",
                    }}
                  />
                </button>
                <h1
                  style={{
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--fuzo-navy)",
                  }}
                >
                  Set up your profile
                </h1>
                <div style={{ width: "40px" }}></div>
              </div>

              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-[#F14C35] flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center text-white">
                    <span className="text-xl">+</span>
                  </button>
                </div>
                <button className="text-[#F14C35] font-medium">
                  Upload photo
                </button>
              </div>

              <div className="max-w-md mx-auto space-y-6 mb-8">
                <FuzoInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={userData.fullName}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="rounded-lg max-w-md mx-auto"
                />
                <FuzoInput
                  label="Username"
                  placeholder="Choose a username"
                  value={userData.username}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="rounded-lg max-w-md mx-auto"
                />
                <FuzoInput
                  label="Bio (Optional)"
                  placeholder="Tell us about yourself"
                  value={userData.bio}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="rounded-lg max-w-md mx-auto"
                />
              </div>

              <FuzoButton
                variant="primary"
                size="lg"
                className="rounded-lg max-w-md w-full mx-auto"
                onClick={nextStep}
              >
                Continue
              </FuzoButton>
            </div>
          </motion.div>
        )}

        {/* Screen 4: Cuisine Preferences */}
        {currentStep === "cuisine" && (
          <motion.div
            key="cuisine"
            {...pageTransition}
            className="min-h-screen bg-white px-6 py-8 flex flex-col"
          >
            <div className="max-w-md mx-auto flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={prevStep}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
                </button>
                <h1 className="font-bold text-[#0B1F3A]">
                  Cuisine Preferences
                </h1>
                <div className="w-10"></div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#0B1F3A] mb-2">
                  What flavors call to you?
                </h2>
                <p className="text-gray-600">
                  Choose your favorite cuisines (select multiple)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8 flex-1">
                {cuisineOptions.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    onClick={() => toggleCuisine(cuisine.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                      userData.cuisines.includes(cuisine.id)
                        ? "border-[#F14C35] bg-[#F14C35]/5"
                        : "border-gray-200 hover:border-[#F14C35]/50"
                    }`}
                  >
                    <span className="text-3xl">{cuisine.emoji}</span>
                    <span className="font-medium text-[#0B1F3A] text-sm text-center">
                      {cuisine.name}
                    </span>
                    {userData.cuisines.includes(cuisine.id) && (
                      <Check className="w-5 h-5 text-[#F14C35]" />
                    )}
                  </button>
                ))}
              </div>

              <FuzoButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={nextStep}
              >
                Next
              </FuzoButton>
            </div>
          </motion.div>
        )}

        {/* Screen 5: Dietary Preferences */}
        {currentStep === "dietary" && (
          <motion.div
            key="dietary"
            {...pageTransition}
            className="min-h-screen bg-white px-6 py-8 flex flex-col"
          >
            <div className="max-w-md mx-auto flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={prevStep}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
                </button>
                <h1 className="font-bold text-[#0B1F3A]">
                  Dietary Preferences
                </h1>
                <div className="w-10"></div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#0B1F3A] mb-2">
                  Any dietary needs?
                </h2>
                <p className="text-gray-600">
                  Help us show you the right food options
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {dietaryOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleDietary(option.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        userData.dietary.includes(option.id)
                          ? "border-[#F14C35] bg-[#F14C35]/5"
                          : "border-gray-200 hover:border-[#F14C35]/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userData.dietary.includes(option.id)
                              ? "bg-[#F14C35]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              userData.dietary.includes(option.id)
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <span className="font-medium text-[#0B1F3A]">
                          {option.name}
                        </span>
                      </div>
                      {userData.dietary.includes(option.id) && (
                        <Check className="w-5 h-5 text-[#F14C35]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <FuzoButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={nextStep}
              >
                Next
              </FuzoButton>
            </div>
          </motion.div>
        )}

        {/* Screen 6: Location Access */}
        {currentStep === "location" && (
          <motion.div
            key="location"
            {...pageTransition}
            className="min-h-screen bg-white px-6 py-8 flex flex-col"
          >
            <div className="max-w-md mx-auto flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={prevStep}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
                </button>
                <h1 className="font-bold text-[#0B1F3A]">Location Access</h1>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                {renderTakoMascot("map")}

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#0B1F3A]">
                    Enable location to discover food near you
                  </h2>
                  <p className="text-gray-600">
                    We'll show you restaurants, cafes, and food spots in your
                    area
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <FuzoButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setUserData((prev) => ({
                        ...prev,
                        locationEnabled: true,
                      }));
                      nextStep();
                    }}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Allow Location
                  </FuzoButton>

                  <FuzoButton
                    variant="tertiary"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setUserData((prev) => ({
                        ...prev,
                        locationEnabled: false,
                      }));
                      nextStep();
                    }}
                  >
                    Not Now
                  </FuzoButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Screen 7: Notifications */}
        {currentStep === "notifications" && (
          <motion.div
            key="notifications"
            {...pageTransition}
            className="min-h-screen bg-white px-6 py-8 flex flex-col"
          >
            <div className="max-w-md mx-auto flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={prevStep}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
                </button>
                <h1 className="font-bold text-[#0B1F3A]">Stay Updated</h1>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                {renderTakoMascot("bell")}

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#0B1F3A]">
                    Get notified about food adventures
                  </h2>
                  <p className="text-gray-600">
                    New restaurants, friend activity, and personalized
                    recommendations
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <FuzoButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setUserData((prev) => ({
                        ...prev,
                        notificationsEnabled: true,
                      }));
                      nextStep();
                    }}
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Enable Notifications
                  </FuzoButton>

                  <FuzoButton
                    variant="tertiary"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setUserData((prev) => ({
                        ...prev,
                        notificationsEnabled: false,
                      }));
                      nextStep();
                    }}
                  >
                    Maybe Later
                  </FuzoButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Screen 8: Success */}
        {currentStep === "success" && (
          <motion.div
            key="success"
            {...pageTransition}
            style={{
              minHeight: "100vh",
              background:
                "linear-gradient(135deg, var(--fuzo-coral) 0%, var(--fuzo-orange-brown) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fuzo-white)",
              padding: "0 24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              style={{ textAlign: "center" }}
            >
              {renderTakoMascot("celebration")}

              <div style={{ margin: "32px 0" }}>
                <h1
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: "var(--font-weight-bold)",
                    marginBottom: "16px",
                  }}
                >
                  Welcome to FUZO!
                </h1>
                <p
                  style={{
                    fontSize: "1.25rem",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Your food adventure begins now
                </p>
              </div>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  marginBottom: "32px",
                }}
              >
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: "16px",
                  }}
                >
                  🎉 Setup complete! You're ready to:
                </p>
                <div style={{ textAlign: "left" }}>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      marginBottom: "8px",
                    }}
                  >
                    • Swipe through amazing restaurants
                  </p>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      marginBottom: "8px",
                    }}
                  >
                    • Connect with food-loving friends
                  </p>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      marginBottom: "8px",
                    }}
                  >
                    • Capture and share your food moments
                  </p>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    • Discover new recipes and flavors
                  </p>
                </div>
              </motion.div>

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ textAlign: "center" }}
              >
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                  }}
                >
                  Redirecting to your feed...
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
