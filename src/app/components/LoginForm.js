"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import config from '../../config';
import { auth as firebaseAuth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'cuckchat';

export default function LoginForm() {
  const { auth } = config;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('chat_token');
    if (token) {
      router.push('/chat');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Site-Name': SITE_NAME },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('chat_token', data.token);
        localStorage.setItem('chat_username', data.username);
        if (data.avatar) localStorage.setItem('chat_avatar', data.avatar);
        router.push('/chat');
      } else {
        // Translation logic from config
        setError(data.error === 'Incorrect password' ? auth.errors.incorrectPassword : 
                 data.error === 'Missing username' ? auth.errors.missingUsername :
                 data.error === 'Username taken' ? auth.errors.usernameTaken :
                 auth.loginError);
      }
    } catch (err) {
      setError(auth.connectionError);
    }
  };

  const handleSocialLogin = async (providerName) => {
    setError('');
    try {
        const provider = googleProvider;
        const result = await signInWithPopup(firebaseAuth, provider);
        const token = await result.user.getIdToken();
        
        const res = await fetch(`${API_URL}/login/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Site-Name': SITE_NAME },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('chat_token', data.token);
            localStorage.setItem('chat_username', data.username);
            if (data.avatar) localStorage.setItem('chat_avatar', data.avatar);
            router.push('/chat');
        } else {
            setError(data.error || 'Social login failed');
        }
    } catch (err) {
        console.error(err);
        setError(auth.connectionError || 'Login Error');
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    const guestUsername = `Guest${Math.floor(Math.random() * 100000)}`;
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Site-Name': SITE_NAME },
        body: JSON.stringify({ username: guestUsername })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('chat_token', data.token);
        localStorage.setItem('chat_username', data.username);
        if (data.avatar) localStorage.setItem('chat_avatar', data.avatar);
        router.push('/chat');
      } else {
        setError(auth.loginError);
      }
    } catch (err) {
      setError(auth.connectionError);
    }
  };

  return (
    <div className="login-box">
      <h2>{auth.loginButton}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder={auth.usernamePlaceholder} 
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input 
          type="password" 
          placeholder={auth.passwordPlaceholder} 
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">{auth.loginButton}</button>
      </form>
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <span style={{ color: '#aaa' }}>{auth.or}</span>
          <button 
            type="button" 
            onClick={handleGuestLogin}
            style={{ 
                marginTop: '10px', 
                backgroundColor: '#555', 
                width: '100%' 
            }}
          >
            {auth.guestButton}
          </button>

          <div style={{marginTop: 15, borderTop: '1px solid #444', paddingTop: 15}}>
            <button type="button" onClick={() => handleSocialLogin('google')} style={{width:'100%', marginBottom:10, background:'#db4437', border:'none', padding:'12px', borderRadius:4, color:'white', fontWeight:'bold', cursor:'pointer', fontSize:'0.9rem'}}>
                {auth.signInGoogle}
            </button>
          </div>
      </div>
    </div>
  );
}
