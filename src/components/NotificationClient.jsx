import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import notiSound from "/noti.mp3";

const socket = io("https://quickserve-5mhc.onrender.com", {
    transports: ["websocket"],
    withCredentials: true,
});

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const audioRef = useRef(null);

    // Enable audio on user action
    const enableSound = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                setSoundEnabled(true);
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }).catch(() => {
                // User blocked autoplay
            });
        }
    };

    useEffect(() => {
        socket.on("connect", () => {
            console.log("✅ Connected:", socket.id);
        });

        socket.on("chat-history", (data) => {
            setNotifications(data);
        });

        socket.on("new-notification", (data) => {
            setNotifications((prev) => [data, ...prev]);

            if (audioRef.current && soundEnabled) {
                audioRef.current.play().catch(() => {
                    // Ignore audio errors here
                });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, [soundEnabled]);

    // Group notifications by table number
    const grouped = notifications.reduce((acc, curr) => {
        if (!acc[curr.tableNo]) acc[curr.tableNo] = [];
        acc[curr.tableNo].push(curr);
        return acc;
    }, {});

    return (
        <div className="p-6 max-w-3xl mx-auto bg-gray-100 rounded shadow-md">
            <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
                🧾 Live Table Notifications
            </h1>

            {!soundEnabled && (
                <div className="mb-4 text-center">
                    <button
                        onClick={enableSound}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        🔊 Enable Notification Sound
                    </button>
                </div>
            )}

            <audio ref={audioRef} src={notiSound} preload="auto" className="hidden" />

            {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-600">No notifications yet.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([tableNo, messages]) => (
                        <div
                            key={tableNo}
                            className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
                        >
                            <h2 className="text-lg font-semibold text-blue-700 mb-2">
                                🍽 Table {tableNo}
                            </h2>
                            <ul className="space-y-2 pl-2">
                                {messages.map((m, idx) => (
                                    <li key={idx} className="text-gray-700 flex justify-between">
                                        <span>📝 {m.message}</span>
                                        <span className="text-xs text-gray-500">
                                            {m.timestamp
                                                ? new Date(m.timestamp).toLocaleTimeString()
                                                : "No time"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
