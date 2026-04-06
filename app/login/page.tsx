'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Temporary database check
        if (email === "test@mail.com" && password === "password123"){
            alert("Login Successful! (Demo Mode)")
        }
        else{
            setError("Invalid email or password")
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className = "w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                
                <h1 className="text-3xl font-semibold text-center mb-10 text-gray-800">
                    Login
                </h1>

                <form onSubmit={handleLogin} className='space-y-6'>
                    {error && <p className='text-red-500 text-sm text-center bg-red-100 p-2 rounded'>{error}</p>}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                    />

                    <input
                        type="password"
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        Log In
                    </button>
                </form>
            </div>
        </main>
    )

}