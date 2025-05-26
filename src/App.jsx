import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const [info, setInfo] = useState({ url: '' });
    const [tempUrl, setTempUrl] = useState('');
    const [shareId, setShareId] = useState(null);

    const initializePlayer = (url) => {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = url;
        }
    };

    const saveStreamInfo = async (url) => {
        try {
            const res = await fetch("https://archon1.wixsite.com/_functions/submitStream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }) // Only send the .m3u8 URL
            });

            const data = await res.json();
            console.log("[Wix] Stream saved:", data);

            if (data.id) {
                setShareId(data.id);
                window.history.replaceState({}, '', `?id=${data.id}`);
            }
        } catch (err) {
            console.error("[Wix] Failed to save stream:", err);
        }
    };

    const handleSaveUrl = () => {
        const updatedInfo = { url: tempUrl };
        setInfo(updatedInfo);
        initializePlayer(tempUrl);
        if (tempUrl) {
            saveStreamInfo(tempUrl);
        }
    };

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const id = query.get("id");

        if (id) {
            fetch(`https://archon1.wixsite.com/xtention/_functions/getStream?id=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.url) return;
                    setInfo({ url: data.url });
                    setTempUrl(data.url);
                    initializePlayer(data.url);
                    setShareId(id);
                })
                .catch(err => console.error("Failed to load shared stream:", err));
        }

        const handleMessage = (event) => {
            const { url } = event.data || {};
            if (!url) return;

            const streamInfo = { url };
            setInfo(streamInfo);
            setTempUrl(url);
            initializePlayer(url);
            saveStreamInfo(url);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
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

            <video ref={videoRef} controls autoPlay style={{ maxWidth: '90vw' }} />

            <div style={{ marginTop: '20px', width: '100%', maxWidth: '600px' }}>
                <input
                    type="text"
                    placeholder=".m3u8 URL"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                />
                <button onClick={handleSaveUrl} style={{ width: '100%', padding: '10px' }}>
                    Save URL
                </button>
            </div>

            {shareId && (
                <div style={{ marginTop: '20px', color: 'lightgreen', wordBreak: 'break-all', textAlign: 'center' }}>
                    <strong>Share this link:</strong><br />
                    <code>{`${window.location.origin}?id=${shareId}`}</code>
                </div>
            )}

            {info.url && (
                <div style={{ marginTop: '20px', fontSize: '14px', color: 'gray', textAlign: 'left', maxWidth: '600px' }}>
                    <p><strong>URL:</strong> {info.url}</p>
                </div>
            )}
        </div>
    );
}
