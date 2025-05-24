import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
            // Security: only accept messages from your Wix site
            if (event.origin !== 'https://archon1.wixsite.com') return;

            const { url, cookies, ua, sessionId } = event.data || {};

            if (!url || !cookies) return; // Require these fields

            setInfo({ url, cookies, ua, sessionId });

            // Cleanup previous hls instance
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
                hlsRef.current = hls;
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = url;
            }

            // Send stream info to Wix backend
            fetch('https://archon1.wixsite.com/_functions/submitStream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    ua,
                    sessionId,
                    cookies,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log('[Wix] Stream saved:', data);
                })
                .catch((err) => {
                    console.error('[Wix] Failed to save stream:', err);
                });
        }

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, []);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'black',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <h1 style={{ marginBottom: '20px' }}>Custom HLS Player</h1>
            <video
                ref={videoRef}
                controls
                autoPlay
                style={{ maxWidth: '90vw', width: '100%', maxHeight: '60vh' }}
            />
            {info && (
                <div style={{ marginTop: '20px', fontSize: '14px', color: 'gray' }}>
                    <p>
                        <strong>URL:</strong> {info.url}
                    </p>
                    <p>
                        <strong>User-Agent:</strong> {info.ua}
                    </p>
                    {info.sessionId && (
                        <p>
                            <strong>Session ID:</strong> {info.sessionId}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
