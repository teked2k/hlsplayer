import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
            // Security: validate origin
            if (event.origin !== "https://archon1.wixsite.com") return;

            // Safety: validate data structure
            if (!event.data || typeof event.data !== 'object') return;

            const { url, cookies, ua } = event.data;

            if (!url || !url.includes('.m3u8')) {
                console.warn("Invalid or missing .m3u8 URL in message.");
                return;
            }

            // Clean up previous instance
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error("HLS error:", data);
                });

                hlsRef.current = hls;
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = url;
            } else {
                console.error("HLS not supported in this browser.");
                return;
            }

            // Update stream info AFTER player setup
            const streamInfo = { url, cookies, ua };
            setInfo(streamInfo);

            // Save info to backend
            fetch("https://archon1.wixsite.com/_functions/submitStream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, ua })
            })
                .then(res => res.json())
                .then(data => console.log("[Wix] Stream saved:", data))
                .catch(err => console.error("[Wix] Failed to save stream:", err));
        }

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.src = '';
            }
        };
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'black',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <h1 style={{ marginBottom: '20px' }}>Custom HLS Player</h1>
            <video
                ref={videoRef}
                controls
                autoPlay
                style={{ maxWidth: '90vw', borderRadius: '8px' }}
            />
            {info && (
                <div style={{ marginTop: '20px', fontSize: '14px', color: 'gray' }}>
                    <p><strong>URL:</strong> {info.url}</p>
                    <p><strong>User-Agent:</strong> {info.ua}</p>
                </div>
            )}
        </div>
    );
}
