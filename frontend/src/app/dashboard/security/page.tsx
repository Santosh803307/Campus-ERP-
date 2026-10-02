"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { Html5Qrcode } from "html5-qrcode";

import AuthGuard from "@/components/AuthGuard";

import {
    getOutPass,
    getOutPassScanLogs,
    scanOutPass,
    verifyOutPass,
    getRecentSecurityScans,
    type OutPass,
    type OutPassScanLog,
    type OutPassScanResponse,
    type OutPassVerification,
    type RecentSecurityScan,
} from "@/services/outPassService";

// =========================================================
// TYPES
// =========================================================

type ScanType = "exit" | "entry";

// =========================================================
// SECURITY DASHBOARD
// =========================================================

export default function SecurityDashboard() {
    // =======================================================
    // SCANNER REFS
    // =======================================================

    const scannerRef = useRef<Html5Qrcode | null>(null);

    const processingScanRef = useRef(false);

    // =======================================================
    // SCAN MODE
    // =======================================================

    const [scanType, setScanType] =
        useState<ScanType>("exit");

    // =======================================================
    // SCANNER STATE
    // =======================================================

    const [scanning, setScanning] =
        useState(false);

    const [processingScan, setProcessingScan] =
        useState(false);

    // =======================================================
    // MESSAGES
    // =======================================================

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // =======================================================
    // OUT-PASS DATA
    // =======================================================

    const [outPass, setOutPass] =
        useState<OutPass | null>(null);

    // =======================================================
    // VERIFICATION DATA
    // =======================================================

    const [verification, setVerification] =
        useState<OutPassVerification | null>(null);

    const [loadingVerification, setLoadingVerification] =
        useState(false);

    // =======================================================
    // LAST SCAN
    // =======================================================

    const [lastScan, setLastScan] =
        useState<OutPassScanResponse | null>(null);

    // =======================================================
    // SCAN LOGS
    // =======================================================

    const [scanLogs, setScanLogs] =
        useState<OutPassScanLog[]>([]);

    const [loadingLogs, setLoadingLogs] =
        useState(false);

    // =======================================================
    // RECENT SECURITY SCANS
    // =======================================================

    const [recentScans, setRecentScans] =
        useState<RecentSecurityScan[]>([]);

    const [loadingRecentScans, setLoadingRecentScans] =
        useState(false);

    // =======================================================
    // STOP SCANNER
    // =======================================================

    const stopScanner =
        useCallback(async () => {
            try {
                if (scannerRef.current) {
                    const scanner =
                        scannerRef.current;

                    scannerRef.current = null;

                    if (scanner.isScanning) {
                        await scanner.stop();
                    }

                    await scanner.clear();
                }
            } catch (err) {
                console.error(
                    "Scanner stop error:",
                    err
                );
            }

            setScanning(false);
        }, []);

    // =======================================================
    // LOAD SCAN LOGS
    // =======================================================

    async function loadScanLogs(
        outPassId: number
    ) {
        setLoadingLogs(true);

        try {
            const logs =
                await getOutPassScanLogs(
                    outPassId
                );

            setScanLogs(logs);
        } catch (err) {
            console.error(
                "Failed to load scan logs:",
                err
            );
        } finally {
            setLoadingLogs(false);
        }
    }

    // =======================================================
    // VERIFY OUT-PASS
    // =======================================================

    async function loadVerification(
        outPassId: number
    ) {
        setLoadingVerification(true);

        try {
            const result =
                await verifyOutPass(
                    outPassId
                );

            setVerification(result);
        } catch (err: any) {
            console.error(
                "Verification failed:",
                err
            );

            const detail =
                err?.response?.data?.detail;

            setError(
                detail ||
                "Unable to load student verification details."
            );
        } finally {
            setLoadingVerification(false);
        }
    }

    // =======================================================
    // LOAD RECENT SECURITY SCANS
    // =======================================================

    const loadRecentScans =
        useCallback(async () => {
            setLoadingRecentScans(true);

            try {
                const scans =
                    await getRecentSecurityScans(
                        20
                    );

                setRecentScans(scans);
            } catch (err: any) {
                console.error(
                    "Failed to load recent scans:",
                    err
                );

                const detail =
                    err?.response?.data?.detail;

                if (detail) {
                    setError(detail);
                }
            } finally {
                setLoadingRecentScans(false);
            }
        }, []);

    // =======================================================
    // HANDLE QR CODE
    // =======================================================

    const handleQRCode =
        useCallback(
            async (qrToken: string) => {
                // Prevent duplicate camera callbacks
                if (
                    !qrToken ||
                    processingScanRef.current
                ) {
                    return;
                }

                processingScanRef.current =
                    true;

                setProcessingScan(true);

                setMessage("");

                setError("");

                setVerification(null);

                try {
                    // -----------------------------------------------
                    // Stop camera immediately
                    // -----------------------------------------------

                    await stopScanner();

                    // -----------------------------------------------
                    // Send QR to backend
                    // -----------------------------------------------

                    const result =
                        await scanOutPass(
                            qrToken,
                            scanType
                        );

                    setLastScan(result);

                    setMessage(
                        result.message
                    );

                    // -----------------------------------------------
                    // Get latest Out-Pass
                    // -----------------------------------------------

                    const latestPass =
                        await getOutPass(
                            result.out_pass_id
                        );

                    setOutPass(
                        latestPass
                    );

                    // -----------------------------------------------
                    // Load individual scan history
                    // -----------------------------------------------

                    await loadScanLogs(
                        result.out_pass_id
                    );

                    // -----------------------------------------------
                    // Load student verification
                    // -----------------------------------------------

                    await loadVerification(
                        result.out_pass_id
                    );

                    // -----------------------------------------------
                    // Refresh recent scans
                    // -----------------------------------------------

                    await loadRecentScans();
                } catch (err: any) {
                    const detail =
                        err?.response?.data?.detail;

                    // Expected validation errors such as
                    // duplicate EXIT / duplicate ENTRY
                    // should not trigger the Next.js error overlay.
                    console.warn(
                        "QR scan rejected:",
                        detail || "Scan failed"
                    );

                    setError(
                        detail ||
                        "Invalid QR code or scan failed."
                    );

                    setLastScan(null);
                } finally {
                    processingScanRef.current =
                        false;

                    setProcessingScan(false);
                }
            },
            [
                scanType,
                stopScanner,
                loadRecentScans,
            ]
        );

    // =======================================================
    // START CAMERA
    // =======================================================

    async function startScanner() {
        if (
            processingScanRef.current
        ) {
            return;
        }

        setMessage("");

        setError("");

        setLastScan(null);

        setOutPass(null);

        setVerification(null);

        setScanLogs([]);

        try {
            // -----------------------------------------------
            // Clean previous scanner
            // -----------------------------------------------

            await stopScanner();

            // -----------------------------------------------
            // Create scanner
            // -----------------------------------------------

            const scanner =
                new Html5Qrcode(
                    "security-qr-reader"
                );

            scannerRef.current =
                scanner;

            // -----------------------------------------------
            // Start camera
            // -----------------------------------------------

            await scanner.start(
                {
                    facingMode:
                        "environment",
                },
                {
                    fps: 10,

                    qrbox: {
                        width: 260,
                        height: 260,
                    },

                    aspectRatio: 1,
                },
                async (decodedText) => {
                    await handleQRCode(
                        decodedText
                    );
                },
                () => {
                    // QR not detected yet.
                    // Ignore continuous scan errors.
                }
            );

            setScanning(true);
        } catch (err) {
            console.error(
                "Camera start failed:",
                err
            );

            scannerRef.current = null;

            setScanning(false);

            setError(
                "Unable to access camera. Please allow camera permission and try again."
            );
        }
    }

    // =======================================================
    // CHANGE SCAN MODE
    // =======================================================

    async function changeScanType(
        type: ScanType
    ) {
        if (processingScan) {
            return;
        }

        await stopScanner();

        setScanType(type);

        setMessage("");

        setError("");

        setLastScan(null);

        setOutPass(null);

        setVerification(null);

        setScanLogs([]);
    }

    // =======================================================
    // REFRESH INDIVIDUAL LOGS
    // =======================================================

    async function refreshLogs() {
        if (!outPass?.id) {
            return;
        }

        await loadScanLogs(
            outPass.id
        );

        await loadVerification(
            outPass.id
        );

        await loadRecentScans();
    }

    // =======================================================
    // CLEANUP
    // =======================================================

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .catch(() => { });
            }
        };
    }, []);

    // =======================================================
    // LOAD RECENT SCANS ON PAGE LOAD
    // =======================================================

    useEffect(() => {
        loadRecentScans();
    }, [loadRecentScans]);

    // =======================================================
    // FORMAT DATE
    // =======================================================

    function formatDate(
        value?: string | null
    ) {
        if (!value) {
            return "—";
        }

        return new Date(
            value
        ).toLocaleString();
    }

    // =======================================================
    // STATUS CLASS
    // =======================================================

    function getStatusClass(
        status?: string
    ) {
        switch (
        status?.toLowerCase()
        ) {
            case "approved":
                return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

            case "used":
                return "bg-blue-500/15 text-blue-400 border-blue-500/30";

            case "rejected":
                return "bg-red-500/15 text-red-400 border-red-500/30";

            case "expired":
                return "bg-orange-500/15 text-orange-400 border-orange-500/30";

            case "pending":
                return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

            default:
                return "bg-slate-500/15 text-slate-300 border-slate-500/30";
        }
    }

    // =======================================================
    // SCAN TYPE CLASS
    // =======================================================

    function getScanTypeClass(
        type: string
    ) {
        if (type === "exit") {
            return "bg-red-500/15 text-red-400";
        }

        return "bg-emerald-500/15 text-emerald-400";
    }

    // =======================================================
    // UI
    // =======================================================

    return (
        <AuthGuard
            allowedRoles={[
                "security",
                "admin",
            ]}
        >
            <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">

                <div className="mx-auto max-w-7xl">

                    {/* =================================================
              HEADER
          ================================================= */}

                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>

                            <div className="mb-2 flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-2xl">
                                    🛡️
                                </div>

                                <h1 className="text-3xl font-bold">
                                    Security Gate
                                </h1>

                            </div>

                            <p className="text-slate-400">
                                Verify student Out-Pass
                                QR codes at the gate.
                            </p>

                        </div>

                        {/* Live Status */}

                        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">

                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

                            <span className="text-sm font-semibold text-emerald-400">
                                Security System Online
                            </span>

                        </div>

                    </div>

                    {/* =================================================
              MAIN GRID
          ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

                        {/* =================================================
                LEFT — SCANNER
            ================================================= */}

                        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">

                            {/* Scan Mode */}

                            <div className="mb-6">

                                <div className="mb-3 flex items-center justify-between">

                                    <h2 className="text-xl font-bold">
                                        Scan Mode
                                    </h2>

                                    <span className="text-sm text-slate-500">
                                        Gate Scanner
                                    </span>

                                </div>

                                <div className="grid grid-cols-2 gap-3">

                                    {/* EXIT */}

                                    <button
                                        type="button"
                                        disabled={
                                            processingScan
                                        }
                                        onClick={() =>
                                            changeScanType(
                                                "exit"
                                            )
                                        }
                                        className={`rounded-2xl px-5 py-4 text-sm font-bold transition ${scanType ===
                                                "exit"
                                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            } ${processingScan
                                                ? "cursor-not-allowed opacity-50"
                                                : ""
                                            }`}
                                    >

                                        <span className="block text-xl">
                                            🚪
                                        </span>

                                        <span className="mt-1 block">
                                            EXIT
                                        </span>

                                    </button>

                                    {/* ENTRY */}

                                    <button
                                        type="button"
                                        disabled={
                                            processingScan
                                        }
                                        onClick={() =>
                                            changeScanType(
                                                "entry"
                                            )
                                        }
                                        className={`rounded-2xl px-5 py-4 text-sm font-bold transition ${scanType ===
                                                "entry"
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            } ${processingScan
                                                ? "cursor-not-allowed opacity-50"
                                                : ""
                                            }`}
                                    >

                                        <span className="block text-xl">
                                            🏫
                                        </span>

                                        <span className="mt-1 block">
                                            ENTRY
                                        </span>

                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                  CAMERA
              ================================================= */}

                            <div className="rounded-3xl border border-slate-800 bg-black p-4">

                                <div className="mb-4 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-lg font-bold">
                                            QR Scanner
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Scan mode:{" "}
                                            <span className="font-bold uppercase">
                                                {scanType}
                                            </span>
                                        </p>

                                    </div>

                                    {scanning && (
                                        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5">

                                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                                            <span className="text-xs font-semibold text-emerald-400">
                                                Camera Active
                                            </span>

                                        </div>
                                    )}

                                </div>

                                <div
                                    id="security-qr-reader"
                                    className="mx-auto min-h-[280px] max-w-lg overflow-hidden rounded-2xl bg-slate-950"
                                />

                                {/* Camera Controls */}

                                <div className="mt-5">

                                    {!scanning ? (

                                        <button
                                            type="button"
                                            disabled={
                                                processingScan
                                            }
                                            onClick={
                                                startScanner
                                            }
                                            className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            📷 Start Camera
                                        </button>

                                    ) : (

                                        <button
                                            type="button"
                                            onClick={
                                                stopScanner
                                            }
                                            className="w-full rounded-2xl bg-slate-700 px-6 py-4 font-bold transition hover:bg-slate-600"
                                        >
                                            ⏹ Stop Camera
                                        </button>

                                    )}

                                </div>

                            </div>

                            {/* =================================================
                  PROCESSING
              ================================================= */}

                            {processingScan && (

                                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">

                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />

                                    <div>

                                        <p className="font-semibold text-blue-300">
                                            Verifying Out-Pass...
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Please wait while the
                                            security system validates
                                            the QR.
                                        </p>

                                    </div>

                                </div>

                            )}

                            {/* =================================================
                  ERROR
              ================================================= */}

                            {error && (

                                <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">

                                    <div className="flex items-start gap-3">

                                        <div className="text-2xl">
                                            ❌
                                        </div>

                                        <div>

                                            <p className="font-bold text-red-300">
                                                Scan Failed
                                            </p>

                                            <p className="mt-1 text-sm text-red-200">
                                                {error}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )}

                            {/* =================================================
                  SUCCESS
              ================================================= */}

                            {message && lastScan && (

                                <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">

                                    <div className="flex items-start gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-xl">
                                            ✓
                                        </div>

                                        <div>

                                            <p className="font-bold text-emerald-300">
                                                Pass Verified
                                            </p>

                                            <p className="mt-1 text-sm text-emerald-200">
                                                {message}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )}

                        </section>

                        {/* =================================================
                RIGHT — PASS DETAILS
            ================================================= */}

                        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">

                            <div className="mb-6 flex items-center justify-between">

                                <div>

                                    <h2 className="text-xl font-bold">
                                        Pass Verification
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Latest scanned Out-Pass
                                    </p>

                                </div>

                                {outPass && (

                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getStatusClass(
                                            outPass.status
                                        )}`}
                                    >
                                        {outPass.status}
                                    </span>

                                )}

                            </div>

                            {!outPass ? (

                                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center">

                                    <div>

                                        <div className="mb-4 text-5xl">
                                            🪪
                                        </div>

                                        <h3 className="font-bold text-slate-300">
                                            No Pass Scanned
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Scan a valid Out-Pass QR
                                            to view student details.
                                        </p>

                                    </div>

                                </div>

                            ) : (

                                <div className="space-y-4">

                                    {/* Out-Pass ID */}

                                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                        <p className="text-xs uppercase tracking-wider text-slate-500">
                                            Out-Pass ID
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            #{outPass.id}
                                        </p>

                                    </div>

                                    {/* Student ID + Status */}

                                    <div className="grid grid-cols-2 gap-3">

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                            <p className="text-xs text-slate-500">
                                                Student ID
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                {outPass.student_id}
                                            </p>

                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                            <p className="text-xs text-slate-500">
                                                Status
                                            </p>

                                            <p className="mt-1 font-semibold uppercase">
                                                {outPass.status}
                                            </p>

                                        </div>

                                    </div>

                                    {/* Destination */}

                                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                        <p className="text-xs text-slate-500">
                                            Destination
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            📍 {outPass.destination}
                                        </p>

                                    </div>

                                    {/* Reason */}

                                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                        <p className="text-xs text-slate-500">
                                            Reason
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {outPass.reason}
                                        </p>

                                    </div>

                                    {/* Emergency Contact */}

                                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                        <p className="text-xs text-slate-500">
                                            Emergency Contact
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            📞{" "}
                                            {
                                                outPass.emergency_contact
                                            }
                                        </p>

                                    </div>

                                    {/* Time */}

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                            <p className="text-xs text-slate-500">
                                                Departure
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatDate(
                                                    outPass.departure_time
                                                )}
                                            </p>

                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                            <p className="text-xs text-slate-500">
                                                Expected Return
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatDate(
                                                    outPass.expected_return_time
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                    {/* =================================================
                      STUDENT VERIFICATION
                  ================================================= */}

                                    {loadingVerification && (

                                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">

                                            <div className="flex items-center gap-3">

                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />

                                                <span className="text-sm text-blue-300">
                                                    Loading student
                                                    verification details...
                                                </span>

                                            </div>

                                        </div>

                                    )}

                                    {verification && (

                                        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">

                                            <div className="mb-4 flex items-center gap-3">

                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-500/20 text-xl">
                                                    👨‍🎓
                                                </div>

                                                <div>

                                                    <p className="font-bold">
                                                        Student Verification
                                                    </p>

                                                    <p className="text-xs text-slate-400">
                                                        Official ERP student
                                                        record
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="space-y-3">

                                                {/* Name */}

                                                <div>

                                                    <p className="text-xs text-slate-500">
                                                        Student Name
                                                    </p>

                                                    <p className="mt-1 font-bold">
                                                        {
                                                            verification.student
                                                                .name
                                                        }
                                                    </p>

                                                </div>

                                                {/* Enrollment */}

                                                <div>

                                                    <p className="text-xs text-slate-500">
                                                        Enrollment No.
                                                    </p>

                                                    <p className="mt-1 font-semibold">
                                                        {
                                                            verification.student
                                                                .enrollment_no
                                                        }
                                                    </p>

                                                </div>

                                                {/* Email */}

                                                <div>

                                                    <p className="text-xs text-slate-500">
                                                        Email
                                                    </p>

                                                    <p className="mt-1 break-all text-sm font-semibold">
                                                        {
                                                            verification.student
                                                                .email
                                                        }
                                                    </p>

                                                </div>

                                                {/* Course + Semester */}

                                                <div className="grid grid-cols-2 gap-3">

                                                    <div className="rounded-xl bg-slate-950/70 p-3">

                                                        <p className="text-xs text-slate-500">
                                                            Course
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold">
                                                            {
                                                                verification
                                                                    .student
                                                                    .course
                                                            }
                                                        </p>

                                                    </div>

                                                    <div className="rounded-xl bg-slate-950/70 p-3">

                                                        <p className="text-xs text-slate-500">
                                                            Semester
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold">
                                                            {
                                                                verification
                                                                    .student
                                                                    .semester
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    )}

                                    {/* =================================================
                      APPROVAL INFORMATION
                  ================================================= */}

                                    {verification && (

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

                                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                                Approval Information
                                            </p>

                                            <div className="mt-3 grid grid-cols-2 gap-3">

                                                <div>

                                                    <p className="text-xs text-slate-500">
                                                        Approved By
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold">
                                                        {verification.approved_by ??
                                                            "—"}
                                                    </p>

                                                </div>

                                                <div>

                                                    <p className="text-xs text-slate-500">
                                                        Approved At
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold">
                                                        {formatDate(
                                                            verification.approved_at
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                    )}

                                    {/* =================================================
                      LATEST SCAN
                  ================================================= */}

                                    {verification?.latest_scan && (

                                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">

                                            <p className="text-xs text-blue-300">
                                                Latest Recorded Scan
                                            </p>

                                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                                <span
                                                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${getScanTypeClass(
                                                        verification
                                                            .latest_scan
                                                            .scan_type
                                                    )}`}
                                                >
                                                    {
                                                        verification
                                                            .latest_scan
                                                            .scan_type
                                                    }
                                                </span>

                                                <span className="text-xs text-slate-400">
                                                    {formatDate(
                                                        verification
                                                            .latest_scan
                                                            .scanned_at
                                                    )}
                                                </span>

                                            </div>

                                            {verification.latest_scan
                                                .remarks && (

                                                    <p className="mt-3 text-xs text-slate-400">
                                                        {
                                                            verification
                                                                .latest_scan
                                                                .remarks
                                                        }
                                                    </p>

                                                )}

                                        </div>

                                    )}

                                    {/* =================================================
                      REFRESH VERIFICATION
                  ================================================= */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            refreshLogs()
                                        }
                                        disabled={
                                            loadingVerification ||
                                            loadingLogs
                                        }
                                        className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loadingVerification
                                            ? "Refreshing..."
                                            : "↻ Refresh Verification"}
                                    </button>

                                </div>

                            )}

                        </section>

                    </div>

                    {/* =================================================
              INDIVIDUAL SCAN HISTORY
          ================================================= */}

                    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="text-xl font-bold">
                                    Out-Pass Scan History
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Scan records for the currently
                                    verified Out-Pass.
                                </p>

                            </div>

                            {outPass && (

                                <button
                                    type="button"
                                    onClick={
                                        refreshLogs
                                    }
                                    disabled={
                                        loadingLogs
                                    }
                                    className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold transition hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {loadingLogs
                                        ? "Refreshing..."
                                        : "↻ Refresh Logs"}
                                </button>

                            )}

                        </div>

                        {scanLogs.length === 0 ? (

                            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center">

                                <div className="text-4xl">
                                    📋
                                </div>

                                <p className="mt-3 font-semibold text-slate-400">
                                    No scan records yet
                                </p>

                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[650px]">

                                    <thead>

                                        <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

                                            <th className="px-4 py-3">
                                                Type
                                            </th>

                                            <th className="px-4 py-3">
                                                Time
                                            </th>

                                            <th className="px-4 py-3">
                                                Security User
                                            </th>

                                            <th className="px-4 py-3">
                                                Remarks
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {scanLogs.map(
                                            (log) => (

                                                <tr
                                                    key={log.id}
                                                    className="border-b border-slate-800/60 last:border-0"
                                                >

                                                    <td className="px-4 py-4">

                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${getScanTypeClass(
                                                                log.scan_type
                                                            )}`}
                                                        >
                                                            {
                                                                log.scan_type
                                                            }
                                                        </span>

                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-300">
                                                        {formatDate(
                                                            log.scanned_at
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-400">
                                                        {log.scanned_by ??
                                                            "Unknown"}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-400">
                                                        {log.remarks ||
                                                            "—"}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                    {/* =================================================
              RECENT SECURITY SCANS
          ================================================= */}

                    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="text-xl font-bold">
                                    🛡️ Recent Security Scans
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Latest EXIT and ENTRY activity
                                    across the security gate.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    loadRecentScans
                                }
                                disabled={
                                    loadingRecentScans
                                }
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loadingRecentScans
                                    ? "Refreshing..."
                                    : "↻ Refresh Recent Scans"}
                            </button>

                        </div>

                        {loadingRecentScans &&
                            recentScans.length === 0 ? (

                            <div className="flex min-h-[180px] items-center justify-center">

                                <div className="flex items-center gap-3 text-slate-400">

                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                                    Loading recent scans...

                                </div>

                            </div>

                        ) : recentScans.length === 0 ? (

                            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center">

                                <div className="text-4xl">
                                    📋
                                </div>

                                <p className="mt-3 font-semibold text-slate-400">
                                    No security scans found
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                    EXIT and ENTRY records will
                                    appear here.
                                </p>

                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[1000px]">

                                    <thead>

                                        <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

                                            <th className="px-4 py-3">
                                                Scan
                                            </th>

                                            <th className="px-4 py-3">
                                                Student
                                            </th>

                                            <th className="px-4 py-3">
                                                Enrollment
                                            </th>

                                            <th className="px-4 py-3">
                                                Course
                                            </th>

                                            <th className="px-4 py-3">
                                                Destination
                                            </th>

                                            <th className="px-4 py-3">
                                                Time
                                            </th>

                                            <th className="px-4 py-3">
                                                Security
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {recentScans.map(
                                            (scan) => (

                                                <tr
                                                    key={
                                                        scan.scan_id
                                                    }
                                                    className="border-b border-slate-800/60 transition hover:bg-slate-800/30 last:border-0"
                                                >

                                                    {/* Scan Type */}

                                                    <td className="px-4 py-4">

                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${getScanTypeClass(
                                                                scan.scan_type
                                                            )}`}
                                                        >
                                                            {
                                                                scan.scan_type
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* Student */}

                                                    <td className="px-4 py-4">

                                                        <div>

                                                            <p className="font-semibold text-white">
                                                                {
                                                                    scan.student_name
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {
                                                                    scan.student_email
                                                                }
                                                            </p>

                                                        </div>

                                                    </td>

                                                    {/* Enrollment */}

                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-300">
                                                        {
                                                            scan.enrollment_no
                                                        }
                                                    </td>

                                                    {/* Course */}

                                                    <td className="px-4 py-4">

                                                        <div>

                                                            <p className="text-sm font-semibold text-slate-300">
                                                                {
                                                                    scan.course
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Semester{" "}
                                                                {
                                                                    scan.semester
                                                                }
                                                            </p>

                                                        </div>

                                                    </td>

                                                    {/* Destination */}

                                                    <td className="px-4 py-4 text-sm text-slate-300">

                                                        <span>
                                                            📍{" "}
                                                            {
                                                                scan.destination
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* Time */}

                                                    <td className="px-4 py-4 text-sm text-slate-400">
                                                        {formatDate(
                                                            scan.scanned_at
                                                        )}
                                                    </td>

                                                    {/* Security User */}

                                                    <td className="px-4 py-4 text-sm text-slate-400">
                                                        {scan.scanned_by ??
                                                            "Unknown"}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                    {/* =================================================
              SECURITY INSTRUCTIONS
          ================================================= */}

                    <section className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-7">

                        <h2 className="text-lg font-bold">
                            🔐 Security Instructions
                        </h2>

                        <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">

                            <div className="rounded-xl bg-slate-900/70 p-4">

                                <strong className="text-white">
                                    1. Verify QR
                                </strong>

                                <p className="mt-1">
                                    Scan only the student's
                                    official ERP QR code.
                                </p>

                            </div>

                            <div className="rounded-xl bg-slate-900/70 p-4">

                                <strong className="text-white">
                                    2. Check Details
                                </strong>

                                <p className="mt-1">
                                    Verify student name,
                                    enrollment, destination,
                                    status and timing.
                                </p>

                            </div>

                            <div className="rounded-xl bg-slate-900/70 p-4">

                                <strong className="text-white">
                                    3. Record Scan
                                </strong>

                                <p className="mt-1">
                                    EXIT and ENTRY scans
                                    are automatically logged.
                                </p>

                            </div>

                        </div>

                    </section>

                </div>

            </main>
        </AuthGuard>
    );
}