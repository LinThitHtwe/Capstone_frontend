'use client';

import { useState } from 'react';

export default function SignUpPage() {
  // Store user input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Submit function (triggered by button)
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from refreshing
    setError(''); // Clear old errors

    if (password !== confirmPassword) {
        setError("Passwords do not match!")
        return;
    }
    
    console.log("Form Submitted to the browser console!", {
        email,
        password,
    });
    alert("Check the browser colsle (Press F12) to see your sign up data!")
  };

  // The UI
  return (
    // The main background, centered everything (like your graph paper drawing)
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      
      {/* 1. The Container Box */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        
        {/* 2. The Title */}
        <h1 className="text-3xl font-semibold text-center mb-10 text-gray-800">
          Create Account
        </h1>

        {/* 3. The Form */}
        <form onSubmit={handleSignUp} className="space-y-6">
          
          {/* Emergency Error Message */}
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-100 p-2 rounded">{error}</p>}

          {/* Email Input Field */}
          <div>
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              // This is the core React part: updating state on every keystroke
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* Create Password Input Field */}
          <div>
            <input 
              type="password" 
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* Confirm Password Input Field */}
          <div>
            <input 
              type="password" 
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* 4. The Sign UP Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Sign Up
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}