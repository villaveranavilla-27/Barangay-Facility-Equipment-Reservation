"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await signIn("credentials", {
      redirect: false,
      identifier: email,
      password,
      intendedRole: "admin",
    });

    if (!res || res.error) {
      alert("Invalid credentials");
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Logo" style={styles.logo} />

        <div style={styles.sectionTitle}>ADMIN LOGIN</div>
        <div style={styles.line}></div>

        <label style={styles.label}>Email</label>
        <input
          type="text"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="button" style={styles.button} onClick={handleLogin}>
          LOGIN
        </button>

        <div style={styles.links}>
          <Link href="/login" style={styles.link}>
            Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f3f3f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  card: {
    width: "600px",
    background: "#fff",
    borderRadius: "28px",
    padding: "50px 60px",
    boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
    border: "1px solid #f0f0f0",
  },
  logo: {
    width: "110px",
    display: "block",
    margin: "0 auto",
  },
  sectionTitle: {
    marginTop: "40px",
    fontSize: "26px",
    fontWeight: "900",
    color: "#2f8f3a",
  },
  line: {
    height: "2px",
    background: "#2f8f3a",
    marginTop: "5px",
  },
  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "5px",
    fontWeight: "600",
    color: "#2b2b2b",
  },
  input: {
    width: "100%",
    height: "44px",
    borderRadius: "6px",
    border: "1px solid #cfd7e3",
    background: "#e8f0fb",
    padding: "0 12px",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    width: "100%",
    height: "48px",
    marginTop: "20px",
    background: "#2c631b",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "900",
    letterSpacing: "1px",
    cursor: "pointer",
  },
  links: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "space-between",
  },
  link: {
    color: "#2f8f3a",
    textDecoration: "none",
    fontWeight: "500",
  },
};