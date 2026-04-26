import React, { useState, useRef, useEffect } from 'react';
import styles from './CreateServerModal.module.css'; // Reusing same styles

const API = "/api";

const EditServerModal = ({ server, onClose, onUpdated }) => {
    const [serverName, setServerName] = useState(server?.name || "");
    const [selectedFile, setSelectedFile] = useState(server?.iconUrl || null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    const UploadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2zM12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19x12 23M8 23h8" /></svg>;

    const handleUploadClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(URL.createObjectURL(file));
            setFileToUpload(file);
        }
    };

    const handleUpdate = async () => {
        if (!serverName.trim()) return;
        setLoading(true);
        try {
            let iconUrl = server.iconUrl;

            // If a new file was selected, upload it to Cloudinary first
            if (fileToUpload) {
                const formData = new FormData();
                formData.append("image", fileToUpload);
                const uploadRes = await fetch(`${API}/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    iconUrl = uploadData.url;
                }
            }

            const res = await fetch(`${API}/servers/${server.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name: serverName, iconUrl }),
            });

            if (res.ok) {
                onUpdated?.();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update server");
            }
        } catch (err) {
            alert("Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                </button>

                <div className={styles.customizeView}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Server Overview</h1>
                        <p className={styles.description}>Update your server's name and icon.</p>
                    </header>

                    <div className={styles.contentCustomize}>
                        <button className={styles.avatarUpload} onClick={handleUploadClick}>
                            {selectedFile ? (
                                <img src={selectedFile} alt="Preview" className={styles.avatarPreview} />
                            ) : (
                                <div className={styles.uploadInner}>
                                    <UploadIcon />
                                    <span>UPLOAD</span>
                                </div>
                            )}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className={styles.hiddenInput} accept="image/*" />

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>SERVER NAME</label>
                            <input
                                type="text"
                                className={styles.inputField}
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.footerWithFlex}>
                        <button className={styles.backButton} onClick={onClose}>Cancel</button>
                        <button className={styles.actionBtn} onClick={handleUpdate} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditServerModal;
