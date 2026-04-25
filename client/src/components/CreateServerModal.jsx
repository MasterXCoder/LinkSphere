import React, { useState, useRef } from 'react';
import styles from './CreateServerModal.module.css';

const templates = [
    { icon: "🎮", label: 'Gaming' },
    { icon: "💖", label: 'Friends' },
    { icon: "📚", label: 'Study Group' },
    { icon: "🏫", label: 'School Club' },
];

const API = "http://localhost:8000/api";

const CreateServerModal = ({ onClose, onCreated }) => {
    // Current view within the modal ('main', 'tellUsMore', 'customize', 'join')
    const [currentView, setCurrentView] = useState('main');
    const [joinError, setJoinError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // State for the customize screen
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [serverName, setServerName] = useState(`${localStorage.getItem("username") || "My"}'s server`);

    // State for the join screen
    const [inviteLink, setInviteLink] = useState('');

    const fileInputRef = useRef(null);

    // Icons
    const CouchIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.522 0-10 4.477-10 10s4.478 10 10 10 10-4.477 10-10-4.478-10-10-10zM12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM15 11.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zM9 11.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zM12 17c-2.206 0-4-1.794-4-4h8c0 2.206-1.794 4-4 4z" /></svg>;
    const EarthIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.522 0-10 4.477-10 10s4.478 10 10 10 10-4.477 10-10-4.478-10-10-10zM12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 11c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z" /></svg>;
    const UploadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2zM12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19x12 23M8 23h8" /></svg>;

    const handleUploadClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(URL.createObjectURL(file));
            setFileToUpload(file);
        }
    };

    const handleFinalCreate = async () => {
        if (!serverName.trim()) return;
        setCreateLoading(true);
        try {
            let iconUrl = null;
            if (fileToUpload) {
                const formData = new FormData();
                formData.append("image", fileToUpload);
                const uploadRes = await fetch(`${API}/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`, // optional if upload route needs it
                    },
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    iconUrl = uploadData.url;
                } else {
                    const errorObj = await uploadRes.json();
                    alert(errorObj.error || "Failed to upload server icon.");
                    setCreateLoading(false);
                    return;
                }
            }

            const res = await fetch(`${API}/servers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name: serverName, iconUrl }),
            });
            if (res.ok) {
                onCreated?.();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create server");
            }
        } catch (err) {
            alert("Could not connect to server");
        } finally {
            setCreateLoading(false);
        }
    }

    // Extract invite code from URL or raw code
    const extractInviteCode = (input) => {
        const trimmed = input.trim();
        const urlMatch = trimmed.match(/\/invite\/([a-zA-Z0-9]+)$/);
        if (urlMatch) return urlMatch[1];
        return trimmed;
    };

    const handleJoinServer = async () => {
        const code = extractInviteCode(inviteLink);
        if (!code) return;
        setJoinError('');
        setJoinLoading(true);

        try {
            const res = await fetch(`${API}/servers/invite/${code}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                onCreated?.();
                onClose();
            } else {
                setJoinError(data.error || "Failed to join server");
            }
        } catch (err) {
            setJoinError("Could not connect to server");
        } finally {
            setJoinLoading(false);
        }
    };
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                <button className={styles.closeButton} onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
                </button>

                {/* --- VIEW 1: MAIN MENU --- */}
                {currentView === 'main' && (
                    <div className={styles.mainView}>
                        <header className={styles.header}>
                            <h1 className={styles.title}>Create Your Server</h1>
                            <p className={styles.description}>Your server is where you and your friends hang out. Make yours and start talking.</p>
                        </header>

                        <div className={styles.content}>
                            <button className={styles.optionBlock} onClick={() => setCurrentView('tellUsMore')}>
                                <div className={styles.optionBlockMain}>
                                    <div className={styles.optionIcon}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 6v12h10V6H7zm8 10H9V8h6v8zm-2-6h-2v2h2v-2z"></path></svg>
                                    </div>
                                    <span className={styles.optionLabel}>Create My Own</span>
                                </div>
                                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                            </button>

                            <h2 className={styles.sectionHeading}>START FROM A TEMPLATE</h2>

                            {templates.map((template, index) => (
                                <button key={index} className={styles.optionBlock}>
                                    <div className={styles.optionBlockMain}>
                                        <div className={styles.optionEmoji}>{template.icon}</div>
                                        <span className={styles.optionLabel}>{template.label}</span>
                                    </div>
                                    <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                                </button>
                            ))}

                            <div className={styles.joinSection}>
                                <h2 className={styles.joinHeading}>Have an invite already?</h2>
                                <button className={styles.joinMenuButton} onClick={() => setCurrentView('join')}>
                                    Join a Server
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VIEW 2: TELL US MORE --- */}
                {currentView === 'tellUsMore' && (
                    <div className={styles.tellUsMoreView}>
                        <header className={styles.header}>
                            <h1 className={styles.title}>Tell Us More About Your Server</h1>
                            <p className={styles.description}>In order to help you with your setup, is your new server for just a few friends or a larger community?</p>
                        </header>

                        <div className={styles.content}>
                            <button className={styles.tellUsOptionBlock} onClick={() => setCurrentView('customize')}>
                                <div className={styles.optionBlockMain}>
                                    <div className={styles.couchCtn}><CouchIcon /></div>
                                    <span className={styles.optionLabel}>For me and my friends</span>
                                </div>
                                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                            </button>

                            <button className={styles.tellUsOptionBlock} onClick={() => setCurrentView('customize')}>
                                <div className={styles.optionBlockMain}>
                                    <div className={styles.earthCtn}><EarthIcon /></div>
                                    <span className={styles.optionLabel}>For a club or community</span>
                                </div>
                                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                            </button>

                            <p className={styles.skipDesc}>
                                Not sure? You can <span className={styles.skipLink} onClick={() => setCurrentView('customize')}>skip this question</span> for now.
                            </p>
                        </div>

                        <div className={styles.footerOnlyBack}>
                            <button className={styles.backButton} onClick={() => setCurrentView('main')}>Back</button>
                        </div>
                    </div>
                )}

                {/* --- VIEW 3: CUSTOMIZE SERVER --- */}
                {currentView === 'customize' && (
                    <div className={styles.customizeView}>
                        <header className={styles.header}>
                            <h1 className={styles.title}>Customize Your Server</h1>
                            <p className={styles.description}>Give your new server a personality with a name and an icon. You can always change it later.</p>
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
                                <label className={styles.inputLabel}>SERVER NAME <span className={styles.asterisk}>*</span></label>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                />
                            </div>

                            <p className={styles.legalNote}>
                                By creating a server, you agree to Discord's <span className={styles.blueLink}>Community Guidelines</span>.
                            </p>
                        </div>

                        <div className={styles.footerWithFlex}>
                            <button className={styles.backButton} onClick={() => setCurrentView('tellUsMore')}>Back</button>
                            <button className={styles.actionBtn} onClick={handleFinalCreate} disabled={createLoading}>
                                {createLoading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- VIEW 4: JOIN A SERVER --- */}
                {currentView === 'join' && (
                    <div className={styles.joinView}>
                        <div className={styles.joinContentWrapper}>
                            <header className={styles.header}>
                                <h1 className={styles.title}>Join a Server</h1>
                                <p className={styles.description}>Enter an invite below to join an existing server</p>
                            </header>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    Invite link <span className={styles.asterisk}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    placeholder="https://linksphere.app/invite/hTKzmak"
                                    value={inviteLink}
                                    onChange={(e) => { setInviteLink(e.target.value); setJoinError(''); }}
                                />
                            </div>

                            <div className={styles.examplesSection}>
                                <h3 className={styles.examplesTitle}>Invites should look like</h3>
                                <div className={styles.tagsContainer}>
                                    <span className={styles.tag}>a1b2c3d4</span>
                                    <span className={styles.tag}>http://localhost:5173/invite/a1b2c3d4</span>
                                </div>
                            </div>

                            <div className={styles.discoverBlock}>
                                <div className={styles.discoverIconWrapper}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-2.73-6.65L16.5 8.5 9.68 15.35c.16.24.41.49.65.65h-1.06zM8.5 16.5l6.85-7.18c-.24-.16-.49-.41-.65-.65L7.82 15.44z" /></svg>
                                </div>
                                <div className={styles.discoverTextContainer}>
                                    <div className={styles.discoverTitle}>Don't have an invite?</div>
                                    <div className={styles.discoverSubtitle}>Check out Discoverable communities in Server Discovery.</div>
                                </div>
                                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                            </div>
                        </div>

                        <div className={styles.footerWithFlex}>
                            <button className={styles.backButton} onClick={() => { setCurrentView('main'); setJoinError(''); }}>Back</button>
                            {joinError && <span style={{ color: '#f38688', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}>{joinError}</span>}
                            <button
                                className={`${styles.actionBtn} ${inviteLink ? styles.actionActive : styles.actionDisabled}`}
                                onClick={handleJoinServer}
                                disabled={!inviteLink.trim() || joinLoading}
                            >
                                {joinLoading ? 'Joining...' : 'Join Server'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CreateServerModal;