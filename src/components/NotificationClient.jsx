import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import notiSound from '/noti.mp3'
const socket = io("https://quickserve-5mhc.onrender.com");

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const tableRef = useRef("");
    const messageRef = useRef("");
    const audioRef = useRef(null); // Sound ref

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected:", socket.id);
        });

        socket.on("chat-history", (data) => {
            setNotifications(data);
        });

        socket.on("new-notification", (data) => {
            setNotifications((prev) => [data, ...prev]);

            // 🔊 Play sound on new notification
            if (audioRef.current) {
                audioRef.current.play().catch((err) => {
                    console.warn("Audio play prevented:", err);
                });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, []);

    const handleSend = () => {
        const tableNo = tableRef.current.value.trim();
        const message = messageRef.current.value.trim();

        if (!tableNo || !message) return;

        socket.emit("send-notification", { tableNo, message });

        tableRef.current.value = "";
        messageRef.current.value = "";
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h1 className="text-xl font-bold mb-4">🧾 Notification Panel</h1>

            {/* Hidden audio player for notification */}
            <audio ref={audioRef} src={notiSound} controls className="hidden" preload="auto"></audio>

            {/* Optional sending UI */}
            {/* <div className="mb-4 space-y-2">
                <input ref={tableRef} placeholder="Table No" className="border p-2 w-full" />
                <input ref={messageRef} placeholder="Message" className="border p-2 w-full" />
                <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2">
                    Send Notification
                </button>
            </div> */}

            <ul className="space-y-2">
                {notifications.map((n, index) => (
                    <li key={index} className="border p-2 rounded">
                        <strong>Table {n.tableNo}:</strong> {n.message}
                        <br />
                        <small>{new Date(n.timestamp).toLocaleString()}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
}
