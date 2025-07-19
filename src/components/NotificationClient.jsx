import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import notiSound from "/noti.mp3";

const socket = io("https://quickserve-5mhc.onrender.com", {
    transports: ["websocket"],
    withCredentials: true,
});

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const [filterTable, setFilterTable] = useState("");
    const [filterOrder, setFilterOrder] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(false);

    const audioRef = useRef(null);
    const newestNotifRef = useRef(null); // ref to scroll to newest notification group

    const enableSound = () => {
        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => {
                    setSoundEnabled(true);
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                })
                .catch(() => { });
        }
    };

    // Scroll into view only when a new notification arrives
    const prevNotificationCount = useRef(0);
    useEffect(() => {
        if (notifications.length > prevNotificationCount.current) {
            newestNotifRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevNotificationCount.current = notifications.length;
    }, [notifications]);

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
                audioRef.current.play().catch(() => { });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, [soundEnabled]);

    // Group notifications by table number
    const groupedByTable = notifications.reduce((acc, curr) => {
        if (!acc[curr.tableNo]) acc[curr.tableNo] = [];
        acc[curr.tableNo].push(curr);
        return acc;
    }, {});

    // Filter grouped notifications by tableNo and order (contained in message)
    const filteredGrouped = Object.entries(groupedByTable).reduce(
        (acc, [table, msgs]) => {
            if (
                filterTable.trim() &&
                table.toLowerCase() !== filterTable.trim().toLowerCase()
            ) {
                return acc;
            }
            const filteredMsgs = msgs.filter((msg) =>
                msg.message.toLowerCase().includes(filterOrder.trim().toLowerCase())
            );
            if (filteredMsgs.length > 0) {
                acc[table] = filteredMsgs;
            }
            return acc;
        },
        {}
    );

    return (
        <div
            className="p-6  mx-auto min-h-screen"
            style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
            }}
        >
            <h1 className="text-3xl font-extrabold mb-6 text-center drop-shadow-lg">
                🧾 Notification Panel
            </h1>

            {!soundEnabled && (
                <div className="mb-4 text-center">
                    <button
                        onClick={enableSound}
                        className="bg-green-500 hover:bg-green-600 transition rounded px-5 py-2 text-white font-semibold shadow-lg"
                        aria-label="Enable Notification Sound"
                    >
                        🔊 Enable Notification Sound
                    </button>
                </div>
            )}

            <audio ref={audioRef} src={notiSound} preload="auto" className="hidden" />

            {/* Filters */}
            <div className="mb-6 flex gap-3 items-center">
                <input
                    type="text"
                    value={filterTable}
                    onChange={(e) => setFilterTable(e.target.value)}
                    placeholder="Filter by Table No"
                    className="flex-1 rounded px-3 py-2 outline-none border-2 border-white bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    aria-label="Filter by Table Number"
                />
                <input
                    type="text"
                    value={filterOrder}
                    onChange={(e) => setFilterOrder(e.target.value)}
                    placeholder="Filter by Order"
                    className="flex-1 rounded px-3 py-2 outline-none border-2 border-white bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    aria-label="Filter by Order"
                />
                <button
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition shadow-lg cursor-not-allowed"
                    onClick={(e) => e.preventDefault()}
                    disabled
                    title="Filtering applied on input change"
                    aria-disabled="true"
                >
                    Find
                </button>
                <button
                    onClick={() => {
                        setFilterTable("");
                        setFilterOrder("");
                    }}
                    className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition shadow-lg"
                    aria-label="Clear filters"
                >
                    Clear
                </button>
            </div>

            <div aria-live="polite" aria-atomic="true">
                {Object.entries(filteredGrouped).length === 0 ? (
                    <p className="text-center text-white/80 text-lg">No notifications found.</p>
                ) : (
                    Object.entries(filteredGrouped).map(([table, msgs], idx, arr) => (
                        <section
                            key={table}
                            ref={idx === 0 ? newestNotifRef : null} // ref to newest table group
                            className="bg-white/10 backdrop-blur-md p-5 rounded-xl shadow-lg mb-8"
                            aria-label={`Notifications for Table ${table}`}
                        >
                            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-md">
                                🪑 Table {table}
                            </h2>
                            <ul className="space-y-3 text-white">
                                <AnimatePresence initial={false}>
                                    {msgs.map((n, idx) => (
                                        <motion.li
                                            key={n._id || idx}
                                            role="listitem"
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="border border-white/30 rounded-lg p-4 bg-gradient-to-r from-purple-600 to-pink-600 shadow-md"
                                        >
                                            <div className="font-medium">{n.message}</div>
                                            <small className="text-sm text-white/80">
                                                {n.timestamp
                                                    ? new Date(n.timestamp).toLocaleString()
                                                    : "No timestamp"}
                                            </small>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}
