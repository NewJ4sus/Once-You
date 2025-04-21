import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../../../config/firebase';
import { Link, useNavigate } from 'react-router-dom';

import '@/pages/Auth/AuthPages.css'

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setError('');
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with this email');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later');
            break;
          default:
            setError('An error occurred during login');
        }
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message || 'Failed to login with Gmail');
      } else {
        setError('Failed to login with Gmail');
      }
    }
  };

  const handleAppleLogin = async () => {
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message || 'Failed to login with Apple');
      } else {
        setError('Failed to login with Apple');
      }
    }
  };

  const handleGithubLogin = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message || 'Failed to login with GitHub');
      } else {
        setError('Failed to login with GitHub');
      }
    }
  };

  return (
    <div className='auth-bg'>
        <div className="auth-container">
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin}>
                <div className="form-group">
                <input
                    type="email"
                    id="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <label htmlFor="email">Email</label>
                </div>
                <div className="form-group">
                <input
                    type="password"
                    id="password"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label htmlFor="password">Password</label>
                </div>
                <button type="submit" disabled={loading} className="button primary">
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div className="social-auth">
                <p>Or login with</p>
                <div className="social-buttons">
                <button className="social-button button" onClick={handleGmailLogin}>
                    <i className="fa-brands fa-google"></i>
                </button>
                <button className="social-button button" onClick={handleGithubLogin}>
                    <i className="fa-brands fa-github"></i>
                </button>
                <button className="social-button button" onClick={handleAppleLogin}>
                    <i className="fa-brands fa-apple"></i>
                </button>
                </div>
            </div>

            <div className="register-link">
                <p>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login; 