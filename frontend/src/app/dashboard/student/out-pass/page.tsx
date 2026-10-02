"use client";

import { useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";

import {
  applyOutPass,
  getMyOutPasses,
  getOutPassQR,
  type OutPass,
} from "@/services/outPassService";

export default function StudentOutPassPage() {
  const [passes, setPasses] = useState<OutPass[]>([]);
  const [loading, setLoading] = useState(true);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] =
    useState<OutPass | null>(null);

  const [qrLoading, setQrLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showApplyForm, setShowApplyForm] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [form, setForm] = useState({
    reason: "",
    destination: "",
    emergency_contact: "",
    departure_time: "",
    expected_return_time: "",
  });

  // =======================================================
  // LOAD OUT-PASSES
  // =======================================================

  async function loadPasses() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyOutPasses();

      setPasses(data);
    } catch (err: any) {
      console.error(
        "Failed to load Out-Passes:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load Out-Passes."
      );
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // APPLY NEW OUT-PASS
  // =======================================================

  const handleApply = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (
        !form.departure_time ||
        !form.expected_return_time
      ) {
        setError(
          "Please select departure and expected return time."
        );
        return;
      }

      const departureTime = new Date(
        form.departure_time
      );

      const expectedReturnTime = new Date(
        form.expected_return_time
      );

      if (
        Number.isNaN(departureTime.getTime()) ||
        Number.isNaN(expectedReturnTime.getTime())
      ) {
        setError("Please enter valid date and time.");
        return;
      }

      if (
        expectedReturnTime <= departureTime
      ) {
        setError(
          "Expected return time must be after departure time."
        );
        return;
      }

      const createdPass = await applyOutPass({
        reason: form.reason.trim(),
        destination: form.destination.trim(),
        emergency_contact:
          form.emergency_contact.trim(),
        departure_time:
          departureTime.toISOString(),
        expected_return_time:
          expectedReturnTime.toISOString(),
      });

      setSuccess(
        `Out-Pass #${createdPass.id} applied successfully.`
      );

      setForm({
        reason: "",
        destination: "",
        emergency_contact: "",
        departure_time: "",
        expected_return_time: "",
      });

      setShowApplyForm(false);

      await loadPasses();
    } catch (err: any) {
      console.error(
        "Failed to apply Out-Pass:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        detail ||
          "Failed to apply for Out-Pass."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // SHOW QR
  // =======================================================

  async function showQR(outPass: OutPass) {
    setError("");
    setQrLoading(true);

    try {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
        setQrUrl(null);
      }

      const blob = await getOutPassQR(
        outPass.id
      );

      const url =
        URL.createObjectURL(blob);

      setQrUrl(url);
      setSelectedPass(outPass);
    } catch (err: any) {
      console.error(
        "QR generation failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to generate QR code."
      );
    } finally {
      setQrLoading(false);
    }
  }

  // =======================================================
  // DOWNLOAD QR
  // =======================================================

  function downloadQR() {
    if (!qrUrl || !selectedPass) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = qrUrl;

    link.download =
      `Out-Pass-${selectedPass.id}-QR.png`;

    document.body.appendChild(link);

    link.click();

    link.remove();
  }

  // =======================================================
  // CLOSE QR
  // =======================================================

  function closeQR() {
    if (qrUrl) {
      URL.revokeObjectURL(qrUrl);
    }

    setQrUrl(null);
    setSelectedPass(null);
  }

  // =======================================================
  // LOAD PAGE
  // =======================================================

  useEffect(() => {
    loadPasses();
  }, []);

  // =======================================================
  // CLEANUP QR URL
  // =======================================================

  useEffect(() => {
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [qrUrl]);

  // =======================================================
  // STATUS CLASS
  // =======================================================

  function getStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case "approved":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

      case "used":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";

      case "returned":
        return "border-purple-500/30 bg-purple-500/10 text-purple-400";

      case "rejected":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "expired":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "cancelled":
        return "border-slate-500/30 bg-slate-500/10 text-slate-400";

      case "pending":
      default:
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }
  }

  // =======================================================
  // FORMAT DATE
  // =======================================================

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <AuthGuard allowedRoles={["student"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-2xl">
                  🪪
                </div>

                <div>
                  <h1 className="text-3xl font-bold">
                    My Out-Passes
                  </h1>

                  <p className="mt-1 text-slate-400">
                    Manage your Hostel Out-Pass
                    and Security QR.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApplyForm(true);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
              >
                + Apply New Out-Pass
              </button>

              <button
                type="button"
                onClick={loadPasses}
                disabled={loading}
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:opacity-50"
              >
                {loading
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>
            </div>
          </div>

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  ✅
                </span>

                <div>
                  <p className="font-bold text-emerald-300">
                    Success
                  </p>

                  <p className="mt-1 text-sm text-emerald-200">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  ❌
                </span>

                <div>
                  <p className="font-bold text-red-300">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-sm text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              APPLY FORM
          ================================================= */}

          {showApplyForm && (
            <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Apply for New Out-Pass
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Submit your outing details
                    for Warden approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowApplyForm(false)
                  }
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleApply}
                className="space-y-5"
              >
                {/* Reason */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reason
                  </label>

                  <textarea
                    required
                    minLength={3}
                    maxLength={500}
                    value={form.reason}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Example: Family function / Medical appointment"
                    className="min-h-[110px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Destination */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Destination
                  </label>

                  <input
                    required
                    minLength={2}
                    maxLength={255}
                    type="text"
                    value={form.destination}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        destination:
                          e.target.value,
                      })
                    }
                    placeholder="Example: Yamuna Nagar"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Emergency Contact */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Emergency Contact
                  </label>

                  <input
                    required
                    minLength={10}
                    maxLength={20}
                    type="tel"
                    value={
                      form.emergency_contact
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergency_contact:
                          e.target.value,
                      })
                    }
                    placeholder="Enter emergency contact number"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Date / Time */}

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Departure Time
                    </label>

                    <input
                      required
                      type="datetime-local"
                      value={
                        form.departure_time
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          departure_time:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Expected Return Time
                    </label>

                    <input
                      required
                      type="datetime-local"
                      value={
                        form.expected_return_time
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expected_return_time:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Buttons */}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Out-Pass"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowApplyForm(false)
                    }
                    className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

              <p className="mt-4 text-slate-400">
                Loading Out-Passes...
              </p>
            </div>
          ) : passes.length === 0 ? (
            /* =================================================
               EMPTY
            ================================================= */

            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <div className="text-5xl">
                🪪
              </div>

              <h2 className="mt-4 text-xl font-bold">
                No Out-Pass Found
              </h2>

              <p className="mt-2 text-slate-500">
                You haven't applied for an
                Out-Pass yet.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowApplyForm(true);
                  setError("");
                }}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
              >
                + Apply Your First Out-Pass
              </button>
            </div>
          ) : (
            /* =================================================
               PASSES
            ================================================= */

            <div className="grid gap-6 md:grid-cols-2">
              {passes.map((pass) => (
                <div
                  key={pass.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
                >
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Hostel Out-Pass
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        #{pass.id}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getStatusClass(
                        pass.status
                      )}`}
                    >
                      {pass.status}
                    </span>
                  </div>

                  {/* DETAILS */}

                  <div className="mt-6 space-y-4">
                    {/* Reason */}

                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Reason
                      </p>

                      <p className="mt-1 font-semibold">
                        {pass.reason}
                      </p>
                    </div>

                    {/* Destination */}

                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Destination
                      </p>

                      <p className="mt-1 font-semibold">
                        📍 {pass.destination}
                      </p>
                    </div>

                    {/* Emergency */}

                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Emergency Contact
                      </p>

                      <p className="mt-1 font-semibold">
                        📞{" "}
                        {pass.emergency_contact}
                      </p>
                    </div>

                    {/* Time */}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Departure
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            pass.departure_time
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Expected Return
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            pass.expected_return_time
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR BUTTON */}

                  <div className="mt-6">
                    {pass.status ===
                      "approved" ||
                    pass.status === "used" ? (
                      <button
                        type="button"
                        onClick={() =>
                          showQR(pass)
                        }
                        disabled={qrLoading}
                        className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {qrLoading
                          ? "Generating QR..."
                          : "📱 View Security QR"}
                      </button>
                    ) : pass.status ===
                      "returned" ? (
                      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-center">
                        <p className="font-semibold text-purple-300">
                          ✅ Out-Pass Completed
                        </p>

                        <p className="mt-1 text-xs text-purple-400/70">
                          Student has returned
                          through the security
                          gate.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
                        <p className="font-semibold text-yellow-300">
                          ⏳ QR Not Available
                        </p>

                        <p className="mt-1 text-xs text-yellow-400/70">
                          QR will be available
                          after Warden approval.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
            <h2 className="font-bold text-blue-300">
              🔐 Security Instructions
            </h2>

            <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-900/70 p-4">
                <p className="font-semibold text-white">
                  1. Get Approval
                </p>

                <p className="mt-1">
                  Your Out-Pass must be
                  approved by the Warden.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/70 p-4">
                <p className="font-semibold text-white">
                  2. Show QR
                </p>

                <p className="mt-1">
                  Show the generated QR code
                  at the security gate.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/70 p-4">
                <p className="font-semibold text-white">
                  3. Keep QR Private
                </p>

                <p className="mt-1">
                  Do not share your QR code
                  with another person.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            QR MODAL
        =================================================== */}

        {qrUrl && selectedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              {/* Modal Header */}

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Security QR
                  </h2>

                  <p className="text-sm text-slate-500">
                    Out-Pass #{selectedPass.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeQR}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300 transition hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* QR IMAGE */}

              <div className="mt-6 rounded-3xl bg-white p-6">
                <img
                  src={qrUrl}
                  alt="Out-Pass QR Code"
                  className="mx-auto h-auto w-full max-w-[320px]"
                />
              </div>

              {/* Pass Info */}

              <div className="mt-5 rounded-2xl bg-slate-950 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Destination
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedPass.destination}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-semibold uppercase">
                      {selectedPass.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instruction */}

              <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                <p className="font-semibold text-blue-300">
                  📱 Show this QR at the
                  Security Gate.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Keep this QR code private.
                </p>
              </div>

              {/* Buttons */}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={downloadQR}
                  className="rounded-xl bg-blue-600 px-4 py-3 font-bold transition hover:bg-blue-500"
                >
                  ⬇ Download
                </button>

                <button
                  type="button"
                  onClick={closeQR}
                  className="rounded-xl bg-slate-800 px-4 py-3 font-bold transition hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}