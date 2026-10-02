"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const notificationRef = useRef<HTMLDivElement>(null);

    // -----------------------------------------
    // Fetch notifications
    // -----------------------------------------
    const fetchNotifications = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setNotifications([]);
            return;
        }

        try {
            setLoading(true);

            const response = await api.get<Notification[]>(
                "/api/notifications/my"
            );

            setNotifications(response.data);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                setNotifications([]);
                return;
            }

            console.error(
                "Failed to fetch notifications:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------
    // Fetch unread count
    // -----------------------------------------
    const fetchUnreadCount = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setUnreadCount(0);
            return;
        }

        try {
            const response = await api.get<{
                unread_count: number;
            }>("/api/notifications/unread-count");

            setUnreadCount(response.data.unread_count);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                setUnreadCount(0);
                return;
            }

            console.error(
                "Failed to fetch unread count:",
                error
            );
        }
    };

    // -----------------------------------------
    // Initial load
    // -----------------------------------------
    useEffect(() => {
        const token = localStorage.getItem(
            "access_token"
        );

        if (!token) {
            return;
        }

        fetchNotifications();
        fetchUnreadCount();
    }, []);

    // -----------------------------------------
    // Refresh unread count periodically
    // -----------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem(
                "access_token"
            );

            if (token) {
                fetchUnreadCount();
            }
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // -----------------------------------------
    // Close dropdown when clicking outside
    // -----------------------------------------
    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // -----------------------------------------
    // Mark single notification as read
    // -----------------------------------------
    const markAsRead = async (
        notificationId: number
    ) => {
        try {
            await api.patch(
                `/api/notifications/${notificationId}/read`
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            is_read: true,
                        }
                        : notification
                )
            );

            setUnreadCount((previous) =>
                Math.max(previous - 1, 0)
            );
        } catch (error) {
            console.error(
                "Failed to mark notification as read:",
                error
            );
        }
    };

    // -----------------------------------------
    // Mark all notifications as read
    // -----------------------------------------
    const markAllAsRead = async () => {
        try {
            await api.patch(
                "/api/notifications/read-all"
            );

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error(
                "Failed to mark all notifications as read:",
                error
            );
        }
    };

    // -----------------------------------------
    // Format notification time
    // -----------------------------------------
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // -----------------------------------------
    // Notification icon
    // -----------------------------------------
    const getNotificationIcon = (
        type: string
    ) => {
        switch (type) {
            case "payment":
                return "💳";

            case "out_pass":
                return "🎫";

            case "no_dues":
                return "📋";

            case "system":
                return "⚙️";

            default:
                return "🔔";
        }
    };

    return (
        <div
            ref={notificationRef}
            className="relative"
        >
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen((previous) => !previous);

                    if (!isOpen) {
                        const token = localStorage.getItem(
                            "access_token"
                        );

                        if (token) {
                            fetchNotifications();
                            fetchUnreadCount();
                        }
                    }
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl transition hover:border-blue-500 hover:bg-slate-800"
                aria-label="Notifications"
            >
                🔔

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg">
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-14 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                        <div>
                            <h3 className="text-base font-bold text-white">
                                Notifications
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                {unreadCount > 0
                                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""
                                    }`
                                    : "You're all caught up"}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="px-5 py-10 text-center text-sm text-slate-400">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <div className="mb-3 text-4xl">
                                    🔔
                                </div>

                                <p className="font-medium text-white">
                                    No notifications
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    You're all caught up.
                                </p>
                            </div>
                        ) : (
                            notifications.map(
                                (notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border-b border-slate-800 px-4 py-4 transition ${notification.is_read
                                            ? "bg-slate-950"
                                            : "bg-blue-950/20"
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.is_read
                                                    ? "bg-slate-800"
                                                    : "bg-blue-500/10"
                                                    }`}
                                            >
                                                {getNotificationIcon(
                                                    notification.notification_type
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4
                                                        className={`text-sm ${notification.is_read
                                                            ? "font-medium text-slate-300"
                                                            : "font-bold text-white"
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </h4>

                                                    {!notification.is_read && (
                                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                                    )}
                                                </div>

                                                <p className="mt-1 text-sm leading-5 text-slate-400">
                                                    {notification.message}
                                                </p>

                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-[11px] text-slate-500">
                                                        {formatTime(
                                                            notification.created_at
                                                        )}
                                                    </span>

                                                    {!notification.is_read && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                                                        >
                                                            Mark read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-slate-800 px-4 py-3 text-center">
                            <span className="text-xs text-slate-500">
                                Campus ERP Notifications
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}