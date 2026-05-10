"use client";

import { useState } from 'react';
import config from '../../config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ContactForm() {
    const contact = config?.contact || {};
    const form = contact?.form || {};
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            // 1. Send to Backend (Firebase)
            await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Site-Name': process.env.NEXT_PUBLIC_SITE_NAME || 'cuckchat' },
                body: JSON.stringify(data)
            });

            // 2. Send to Formspree
            const formspreeRes = await fetch("https://formspree.io/f/xanrppgy", {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData // Formspree accepts FormData directly
            });

            if (formspreeRes.ok) {
                setStatus('success');
                e.target.reset();
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>{contact.title || 'Contact'}</h2>
            {status === 'success' ? (
                <div style={{ padding: '20px', color: '#2ecc71', fontWeight: 'bold' }}>
                    {form.success || 'Message sent successfully!'}
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email</label>
                        <input type="email" name="email" id="email" required placeholder={form.emailPlaceholder || 'Your email'} />
                    </div>
                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Message</label>
                        <textarea 
                            name="message" 
                            id="message" 
                            rows="5" 
                            required 
                            placeholder={form.messagePlaceholder || 'Your message'}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#333',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        ></textarea>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? (form.sending || 'Sending...') : (form.submit || 'Send Message')}
                    </button>
                    {status === 'error' && (
                        <p style={{ color: '#e74c3c', marginTop: '10px' }}>
                            {form.error || 'Error sending message.'}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}
