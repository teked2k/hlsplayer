import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
            if (!event.data.url || !event.data.cookies) return;

            const streamInfo = {
                url: event.data.url,
                cookies: event.data.cookies,
                ua: event.data.ua
            };

            setInfo(streamInfo);

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamInfo.url);
                hls.attachMedia(videoRef.current);
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = streamInfo.url;
            }

            // Send stream info to Wix backend
            fetch("https://your-wix-site.com/_functions/submitStream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: streamInfo.url,
                    ua: streamInfo.ua
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
                </div>
            )}
        </div>
    );
}
