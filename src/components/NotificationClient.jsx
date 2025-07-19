import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import notiSound from "/noti.mp3";

const socket = io("https://quickserve-5mhc.onrender.com", {
    transports: ["websocket"],
    withCredentials: true,
});

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const audioRef = useRef(null);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("✅ Connected:", socket.id);
        });

        socket.on("chat-history", (data) => {
            setNotifications(data);
        });

        socket.on("new-notification", (data) => {
            setNotifications((prev) => [data, ...prev]);

            if (audioRef.current) {
                audioRef.current.play().catch((err) => {
                    console.warn("🔇 Audio play prevented:", err);
                });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, []);

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

            <audio ref={audioRef} src={notiSound} preload="auto" className="hidden" />

            {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-600">No notifications yet.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([tableNo, messages]) => (
                        <div key={tableNo} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <h2 className="text-lg font-semibold text-blue-700 mb-2">
                                🍽 Table {tableNo}
                            </h2>
                            <ul className="space-y-2 pl-2">
                                {messages.map((m, idx) => (
                                    <li key={idx} className="text-gray-700">
                                        <div className="flex justify-between">
                                            <span>📝 {m.message}</span>
                                            <span className="text-xs text-gray-500">
                                                {m.timestamp
                                                    ? new Date(m.timestamp).toLocaleTimeString()
                                                    : "No time"}
                                            </span>
                                        </div>
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
