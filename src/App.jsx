import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
    const videoRef = useRef(null);
    const [info, setInfo] = useState({ url: '' });
    const [tempUrl, setTempUrl] = useState('');
    const [shareId, setShareId] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);

    // Load bookmarks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bookmarkedUrls');
        if (saved) {
            setBookmarks(JSON.parse(saved));
        }
    }, []);

    // Save bookmarks to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('bookmarkedUrls', JSON.stringify(bookmarks));
    }, [bookmarks]);

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
            const res = await fetch("https://archon1.wixsite.com/xtention_functions/submitStream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
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
        if (!tempUrl) return;

        const updatedInfo = { url: tempUrl };
        setInfo(updatedInfo);
        initializePlayer(tempUrl);
        saveStreamInfo(tempUrl);

        if (!bookmarks.includes(tempUrl)) {
            setBookmarks(prev => [...prev, tempUrl]);
        }
    };

    // Load shared stream from URL id param
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

                    if (!bookmarks.includes(data.url)) {
                        setBookmarks(prev => [...prev, data.url]);
                    }
                })
                .catch(err => console.error("Failed to load shared stream:", err));
        }

        const handleMessage = (event) => {
            // OPTIONAL: Check event.origin if you want to filter only from Wix
            // if (!event.origin.includes("wixsite.com")) return;

            const { url } = event.data || {};
            if (!url) return;

            const streamInfo = { url };
            setInfo(streamInfo);
            setTempUrl(url);
            initializePlayer(url);
            saveStreamInfo(url);

            if (!bookmarks.includes(url)) {
                setBookmarks(prev => [...prev, url]);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [bookmarks]);

    const handleBookmarkClick = (url) => {
        setTempUrl(url);
        setInfo({ url });
        initializePlayer(url);
    };

    const handleDeleteBookmark = (url) => {
        setBookmarks(prev => prev.filter(b => b !== url));
        if (info.url === url) {
            setInfo({ url: '' });
            setTempUrl('');
            videoRef.current.pause();
            videoRef.current.src = '';
        }
    };

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

            {bookmarks.length > 0 && (
                <div style={{
                    marginTop: '30px',
                    width: '100%',
                    maxWidth: '600px',
                    color: 'white',
                    textAlign: 'left'
                }}>
                    <h3>Bookmarks</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {bookmarks.map((url) => (
                            <li key={url} style={{
                                marginBottom: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#222',
                                padding: '8px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}>
                                <span
                                    onClick={() => handleBookmarkClick(url)}
                                    style={{
                                        flexGrow: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                    title={url}
                                >
                                    {url}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBookmark(url);
                                    }}
                                    style={{
                                        marginLeft: '10px',
                                        backgroundColor: 'red',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        padding: '4px 8px'
                                    }}
                                    aria-label={`Delete bookmark for ${url}`}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
