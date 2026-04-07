"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role: "USER" }),
    });
    if (res.ok) {
      toast.success("Account created.");
      router.push("/login");
    } else {
      toast.error("Unable to create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Barangay GO!" className="mx-auto h-30 w-35 mb-2" />
          <h1 className="text-2xl font-bold text-[#165719] uppercase">Create Account</h1>
          <div className="h-1 w-16 bg-[#165719] mx-auto my-2"></div>
        </div>

        {/* Registration Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[#165719] text-xs uppercase mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              required
              placeholder="Enter full name"
              className="w-full border-b-2 border-[#165719] px-4 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[#165719] text-xs uppercase mb-1">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border-b-2 border-[#165719] px-4 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[#165719] text-xs uppercase mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="Password"
              className="w-full border-b-2 border-[#165719] px-4 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[#165719] text-xs uppercase mb-1">Confirm Password</label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              placeholder="Confirm Password"
              className="w-full border-b-2 border-[#165719] px-4 py-2 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#165719] text-white px-4 py-3 rounded-2xl font-medium hover:bg-[#165719]"
          >
            Create Account
          </button>
        </form>

        {/* Separator and Social Sign-Up */}
        <div className="flex items-center mt-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-500 text-sm">or sign up using</span>
          <hr className="flex-grow border-gray-300" />
        </div>
        <button className="w-full flex items-center justify-center border border-gray-300 rounded-2xl px-4 py-2 mt-4 hover:bg-gray-100">
          {/* Add Google SVG/icon here */}
          <span className="ml-2">Sign Up with Google</span>
        </button>
        <button className="w-full flex items-center justify-center bg-blue-600 text-white rounded-2xl px-4 py-2 mt-2 hover:bg-blue-700">
          {/* Add Facebook SVG/icon here */}
          <span className="ml-2">Sign Up with Facebook</span>
        </button>

        {/* Login Link */}
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#165719] font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
