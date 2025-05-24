import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
            const { url, cookies, ua, sessionId } = event.data || {};

            if (!url || !cookies) return; // Require these fields

            const streamInfo = { url, cookies, ua, sessionId };
            setInfo(streamInfo);

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = url;
            }

            // Send stream info to Wix backend, including sessionId if available
            fetch("https://archon1.wixsite.com/_functions/submitStream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    ua,
                    sessionId,  // added here
                    cookies,    // optionally send cookies if needed
                })
            })
                .then(res => res.json())
                .then(data => {
                    console.log("[Wix] Stream saved:", data);
                })
                .catch(err => {
                    console.error("[Wix] Failed to save stream:", err);
                });
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>Custom HLS Player</h1>
            <video ref={videoRef} controls autoPlay style={{ maxWidth: '90vw' }} />
            {info && (
                <div style={{ marginTop: '20px', fontSize: '14px', color: 'gray' }}>
                    <p><strong>URL:</strong> {info.url}</p>
                    <p><strong>User-Agent:</strong> {info.ua}</p>
                    {info.sessionId && <p><strong>Session ID:</strong> {info.sessionId}</p>}
                </div>
            )}
        </div>
    );
}
