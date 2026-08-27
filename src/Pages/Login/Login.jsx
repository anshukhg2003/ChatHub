import React, { useState } from "react";
import { supabase } from "../../Config/SupabaseClient";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import assets from "../../assets/assets";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // =============================
      // NEW USER SIGNUP
      // =============================

      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),

          password,

          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!data.user) {
          throw new Error("Unable to create account");
        }

        // New user goes to profile update
        navigate("/profile-update");

        return;
      }

      // =============================
      // EXISTING USER LOGIN
      // =============================

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),

          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("User not found");
      }

      // Existing user directly enters chat
      navigate("/chat", {
        replace: true,
      });
    } catch (error) {
      console.error("Authentication error:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {error && (
        <p
          style={{
            color: "red",
            fontSize: "14px",
            margin: "4px 0",
          }}
        >
          {error}
        </p>
      )}

      <div className="ambient ambient-one" />

      <div className="ambient ambient-two" />

      <section className="login-shell" aria-label="ChatHub account access">
        <aside className="welcome-panel">
          <img
            className="left-illustration"
            src={assets.left_side_background}
            alt=""
          />
        </aside>

        <div className="login-content">
          <a className="auth-brand brand logo-wordmark" href="/">
            <img src={assets.chathub_logo2} alt="ChatHub" />
          </a>

          <div className="form-intro">
            <p>{isSignUp ? "Start a new chat Journey" : "WELCOME BACK"}</p>

            <h2>
              {isSignUp ? (
                "Create your account"
              ) : (
                <>
                  Sign in to <span className="chat-title-word">ChatHub</span>
                </>
              )}
            </h2>

            <span>
              {isSignUp
                ? "Start collaborating with your friends in seconds."
                : "Messages that feel like meetups🤝"}
            </span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="form-field">
                <span>Full name</span>

                <input
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            )}

            <label className="form-field">
              <span>Email address</span>

              <input
                type="email"
                placeholder="name@gmail.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Password</span>

              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {!isSignUp && (
              <div className="form-options">
                <label>
                  <input type="checkbox" />
                  Remember me
                </label>

                <button type="button">Forgot password?</button>
              </div>
            )}

            {isSignUp && (
              <label className="terms">
                <input type="checkbox" required />I agree to the{" "}
                <a href="#terms">Terms of Service</a> and{" "}
                <a href="#privacy">Privacy Policy</a>.
              </label>
            )}

            <button className="submit-button" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}

              <span>&rarr;</span>
            </button>
          </form>

          <p className="switch-mode">
            {isSignUp ? "Already have an account?" : "New to ChatHub?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);

                setError("");
              }}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
