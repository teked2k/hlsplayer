import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const [info, setInfo] = useState({ url: '', cookies: '', ua: navigator.userAgent, sessionId: '' });
    const [tempUrl, setTempUrl] = useState('');
    const [tempCookies, setTempCookies] = useState('');

    const initializePlayer = (url) => {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = url;
        }
    };

    const saveStreamInfo = (url, cookies) => {
        fetch("https://archon1.wixsite.com/_functions/submitStream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url,
                ua: info.ua,
                sessionId: info.sessionId,
                cookies,
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("[Wix] Stream saved:", data);
            })
            .catch(err => {
                console.error("[Wix] Failed to save stream:", err);
            });
    };

    const handleSaveUrl = () => {
        const updatedInfo = { ...info, url: tempUrl };
        setInfo(updatedInfo);
        initializePlayer(tempUrl);
        if (tempUrl && info.cookies) {
            saveStreamInfo(tempUrl, info.cookies);
        }
    };

    const handleSaveCookies = () => {
        const updatedInfo = { ...info, cookies: tempCookies };
        setInfo(updatedInfo);
        if (info.url && tempCookies) {
            saveStreamInfo(info.url, tempCookies);
        }
    };

    useEffect(() => {
        function handleMessage(event) {
            const { url, cookies, ua, sessionId } = event.data || {};
            if (!url || !cookies) return;

            const streamInfo = { url, cookies, ua, sessionId };
            setInfo(streamInfo);
            initializePlayer(url);
            saveStreamInfo(url, cookies);
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>Custom HLS Player</h1>

            <video ref={videoRef} controls autoPlay style={{ maxWidth: '90vw' }} />

            <div style={{ marginTop: '20px', width: '90%', maxWidth: '600px' }}>
                <input
                    type="text"
                    placeholder=".m3u8 URL"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                />
                <button onClick={handleSaveUrl} style={{ width: '100%', padding: '10px', marginBottom: '16px' }}>
                    Save URL
                </button>

                <input
                    type="text"
                    placeholder="Cookies"
                    value={tempCookies}
                    onChange={(e) => setTempCookies(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                />
                <button onClick={handleSaveCookies} style={{ width: '100%', padding: '10px' }}>
                    Save Cookies
                </button>
            </div>

            {info.url && (
                <div style={{ marginTop: '20px', fontSize: '14px', color: 'gray', textAlign: 'left', maxWidth: '600px' }}>
                    <p><strong>URL:</strong> {info.url}</p>
                    <p><strong>Cookies:</strong> {info.cookies}</p>
                    <p><strong>User-Agent:</strong> {info.ua}</p>
                    {info.sessionId && <p><strong>Session ID:</strong> {info.sessionId}</p>}
                </div>
            )}
        </div>
    );
}
