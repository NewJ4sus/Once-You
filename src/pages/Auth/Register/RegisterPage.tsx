import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../../../config/firebase';
import '@/pages/Auth/AuthPages.css';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Email validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Password length validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to home after successful registration
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('An account with this email already exists');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          case 'auth/operation-not-allowed':
            setError('Email/password accounts are not enabled');
            break;
          case 'auth/weak-password':
            setError('Password is too weak');
            break;
          default:
            setError(err.message || 'Failed to register');
        }
      } else {
        setError('Failed to register');
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
          <h2>Register</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleRegister}>
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
            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <label htmlFor="confirmPassword">Confirm Password</label>
            </div>
            <button type="submit" disabled={loading} className="button primary">
              {loading ? 'Registering...' : 'Register'}
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
              Already have an account? <Link to="/login">Login</Link>
            </p>  
          </div>
        </div>
    </div>
  );
};

export default Register; 