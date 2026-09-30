import React, { useRef, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import DataContext from '../../../Context/AdminContext/Datacontext';
import AnotherContext from '../../../Context/AdminContext/AnotherContext';
import '../../Admin-Dashboard/css/Attendance.css';

const Attendance = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    const { allCombined } = useContext(DataContext);
    const { attendance, handlePresent } = useContext(AnotherContext);

    const [faces, setFaces] = useState([]);
    const [camActive, setCamActive] = useState(false);
    const [filter, setFilter] = useState('all');

    const getInitials = (emp) =>
        `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();

    const formatTime = (time) => {
        const dateToFormat = time ? new Date(time) : new Date();
        return dateToFormat.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getImageSrc = (image) => {
        if (!image?.data) return null;
        try {
            const base64 = btoa(
                new Uint8Array(image.data.data).reduce(
                    (d, b) => d + String.fromCharCode(b),
                    '',
                ),
            );
            return `data:${image.contentType};base64,${base64}`;
        } catch {
            return null;
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current.play();
                        setCamActive(true);
                        startAutoScan();
                    } catch (e) {
                        console.error('Playback failed', e);
                    }
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            alert('Please allow camera access in browser settings.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject
                .getTracks()
                .forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCamActive(false);
        setFaces([]);
    };

    const startAutoScan = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
            const video = videoRef.current;
            if (!video || video.paused || video.readyState < 2) return;

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const image = canvas.toDataURL('image/jpeg', 0.6);
            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/face-recognize`,
                    { image },
                );
                const detected = res.data.results || [];
                setFaces(detected);

                detected.forEach((face) => {
                    if (face.name !== 'Unknown') {
                        const emp = allCombined.find(
                            (e) => `${e.firstName}_${e.lastName}` === face.name,
                        );
                        if (emp) handlePresent(emp._id);
                    }
                });
            } catch (err) {
                console.log('API scan error');
            }
        }, 3000);
    };

    useEffect(() => {
        if (!camActive) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        let animationFrame;

        const draw = () => {
            if (video.readyState >= 2) {
                canvas.width = video.offsetWidth;
                canvas.height = video.offsetHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                faces.forEach((face) => {
                    const { top, left, right, bottom } = face.box;
                    const scaleX = canvas.width / video.videoWidth;
                    const scaleY = canvas.height / video.videoHeight;

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        left * scaleX,
                        top * scaleY,
                        (right - left) * scaleX,
                        (bottom - top) * scaleY,
                    );
                });
            }
            animationFrame = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [faces, camActive]);

    const filteredEmployees = allCombined.filter((emp) => {
        const isPresent = attendance[emp._id]?.isPresent;
        if (filter === 'present') return isPresent;
        if (filter === 'absent') return !isPresent;
        return true;
    });

    return (
        <div className="att-root">
            <header className="att-header">
                <h2 className="att-header-title">
                    <span className="att-pulse" />
                    FACE ATTENDANCE
                </h2>
                <div className="att-stats">
                    <div className="att-stat">
                        Present{' '}
                        <span>
                            {
                                allCombined.filter(
                                    (e) => attendance[e._id]?.isPresent,
                                ).length
                            }
                        </span>
                    </div>
                    <div className="att-stat">
                        Absent{' '}
                        <span>
                            {
                                allCombined.filter(
                                    (e) => !attendance[e._id]?.isPresent,
                                ).length
                            }
                        </span>
                    </div>
                    <div className="att-stat">
                        Total <span>{allCombined.length}</span>
                    </div>
                </div>
            </header>

            <div className="att-body">
                <aside className="att-left">
                    <div className="att-section-label">CAMERA FEED</div>

                    <div
                        className="att-camera-frame"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <div className="att-corner tl" />
                        <div className="att-corner tr" />
                        <div className="att-corner bl" />
                        <div className="att-corner br" />

                        <div
                            className="att-scan-line"
                            style={{ display: camActive ? 'block' : 'none' }}
                        />

                        <div
                            className="att-video-wrap"
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                display: camActive ? 'block' : 'none',
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                }}
                            />
                            <div
                                className="att-cam-overlay"
                                style={{ display: 'flex' }}
                            >
                                <span className="att-cam-badge">LIVE</span>
                                <div className="att-cam-rec">
                                    <span className="att-rec-dot" /> REC
                                </div>
                            </div>
                        </div>

                        {!camActive && (
                            <div className="att-cam-placeholder">
                                <svg
                                    width="44"
                                    height="44"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    style={{ opacity: 0.2 }}
                                >
                                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.889L15 14" />
                                    <rect
                                        x="3"
                                        y="6"
                                        width="12"
                                        height="12"
                                        rx="2"
                                    />
                                </svg>
                                <span className="att-cam-placeholder-label">
                                    Camera Offline
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="att-cam-controls">
                        <button
                            className="att-btn att-btn-start"
                            onClick={startCamera}
                            disabled={camActive}
                        >
                            Start Camera
                        </button>
                        <button
                            className="att-btn att-btn-stop"
                            onClick={stopCamera}
                            disabled={!camActive}
                        >
                            Stop Camera
                        </button>
                    </div>

                    <div className="att-section-label">DETECTED FACES</div>
                    <div className="att-detected-box">
                        {faces.length === 0 && (
                            <span className="att-no-faces">
                                No detection...
                            </span>
                        )}
                        {faces.map((f, i) => (
                            <span
                                key={i}
                                className={`att-face-chip ${f.name !== 'Unknown' ? 'known' : 'unknown'}`}
                            >
                                {f.name}
                            </span>
                        ))}
                    </div>
                </aside>

                <main className="att-right">
                    <div className="att-toolbar">
                        <div className="att-filter-tabs">
                            {['all', 'present', 'absent'].map((f) => (
                                <button
                                    key={f}
                                    className={`att-tab ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="att-grid">
                        {filteredEmployees.map((emp) => {
                            const attRecord = attendance[emp._id];
                            const isPresent = attRecord?.isPresent;
                            return (
                                <div
                                    key={emp._id}
                                    className={`att-emp-card ${isPresent ? 'present' : 'absent'}`}
                                >
                                    {isPresent && (
                                        <div className="att-scan-dot" />
                                    )}
                                    <div className="att-card-top">
                                        <div className="att-avatar">
                                            {getImageSrc(emp.image) ? (
                                                <img
                                                    src={getImageSrc(emp.image)}
                                                    alt="p"
                                                />
                                            ) : (
                                                getInitials(emp)
                                            )}
                                        </div>
                                        <div>
                                            <p className="att-emp-name">
                                                {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="att-emp-role">
                                                {emp.role}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Entry Time Section */}
                                    <div
                                        className="att-card-time"
                                        style={{
                                            padding: '12px 15px',
                                            fontSize: '0.85rem',
                                            borderTop:
                                                '1px solid rgba(255,255,255,0.08)',
                                            marginTop: '8px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: 'rgba(255,255,255,0.5)',
                                                }}
                                            >
                                                TIME:
                                            </span>
                                            <span
                                                style={{
                                                    color: isPresent
                                                        ? '#4ade80'
                                                        : '#ff4d4d',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                {isPresent
                                                    ? formatTime(
                                                          attRecord.timeIn,
                                                      )
                                                    : '--:--'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="att-card-footer">
                                        <span
                                            className={`att-status-pill ${isPresent ? 'present' : 'absent'}`}
                                        >
                                            {isPresent ? 'Present' : 'Absent'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Attendance;
