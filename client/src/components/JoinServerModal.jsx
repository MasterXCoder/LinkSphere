import React, { useState } from 'react';
import styles from './CreateServerModal.module.css';

const API = "/api";

export default function JoinServerModal({ onClose, onJoined }) {
    const [serverId, setServerId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!serverId.trim()) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API}/servers/${serverId.trim()}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                onJoined?.();
                onClose();
            } else {
                setError(data.error || "Failed to join server");
            }
        } catch (err) {
            setError("Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 className={styles.title}>Join a Server</h2>
                    <p className={styles.subtitle}>Enter the server ID to join an existing server</p>

                    <div style={{ margin: '1.5rem 0' }}>
                        <input
                            type="text"
                            value={serverId}
                            onChange={(e) => setServerId(e.target.value)}
                            placeholder="Enter server ID"
                            className={styles.nameInput}
                            style={{ textAlign: 'center' }}
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#f38688', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
                    )}

                    <button
                        className={styles.createBtn}
                        onClick={handleJoin}
                        disabled={!serverId.trim() || loading}
                        style={{
                            width: '100%',
                            padding: '0.7rem',
                            background: '#23a559',
                            opacity: !serverId.trim() || loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? "Joining..." : "Join Server"}
                    </button>
                </div>
            </div>
        </div>
    );
}
