"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createSupportTicket,
  getMySupportTickets,
  SupportTicket,
} from "@/services/supportService";

const departments = [
  {
    name: "Accounts Department",
    icon: "💰",
    description: "Fees, payments, receipts and refunds",
  },
  {
    name: "Examination Cell",
    icon: "📝",
    description: "Examination schedule, results and admit cards",
  },
  {
    name: "Central Library",
    icon: "📚",
    description: "Library books, fines and access issues",
  },
  {
    name: "Hostel Department",
    icon: "🏠",
    description: "Hostel, rooms and out-pass related issues",
  },
  {
    name: "Academic Department",
    icon: "🎓",
    description: "Courses, subjects and academic information",
  },
  {
    name: "IT Support",
    icon: "💻",
    description: "Portal login and technical problems",
  },
];

const faqs = [
  {
    question: "How can I report a technical problem?",
    answer:
      "Select IT Support and submit your issue with a detailed description.",
  },
  {
    question: "Where can I check my fee payment?",
    answer:
      "Go to Student Dashboard → Fees to view your fee details and payment history.",
  },
  {
    question: "How can I contact the Examination Cell?",
    answer:
      "Select Examination Cell from the support departments and submit your query.",
  },
  {
    question: "How can I report a hostel issue?",
    answer:
      "Select Hostel Department and describe your hostel-related problem.",
  },
];

export default function StudentSupportPage() {
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // LOAD STUDENT SUPPORT TICKETS
  // =====================================================

  useEffect(() => {
    async function loadTickets() {
      try {
        setTicketsLoading(true);

        const response =
          await getMySupportTickets();

        setTickets(response.data);
      } catch (error) {
        console.error(
          "Failed to load support tickets:",
          error
        );
      } finally {
        setTicketsLoading(false);
      }
    }

    loadTickets();
  }, []);

  // =====================================================
  // SUBMIT SUPPORT TICKET
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (
      !department ||
      !category ||
      !description.trim()
    ) {
      setErrorMessage(
        "Please fill all required fields."
      );

      return;
    }

    try {
      setSubmitting(true);

      const ticket =
        await createSupportTicket({
          department,
          category,
          description: description.trim(),
        });

      // Add newly created ticket at top
      setTickets((previous) => [
        ticket,
        ...previous,
      ]);

      // Reset form
      setDepartment("");
      setCategory("");
      setDescription("");

      setSuccessMessage(
        `Support request #${ticket.id} submitted successfully.`
      );
    } catch (error) {
      console.error(
        "Failed to create support ticket:",
        error
      );

      setErrorMessage(
        "Unable to submit your support request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // STATUS STYLE
  // =====================================================

  function getStatusStyle(status: string) {
    switch (status.toLowerCase()) {
      case "open":
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";

      case "in_progress":
      case "in progress":
        return "border-orange-500/20 bg-orange-500/10 text-orange-400";

      case "resolved":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

      case "closed":
        return "border-slate-700 bg-slate-800 text-slate-400";

      default:
        return "border-slate-700 bg-slate-800 text-slate-400";
    }
  }

  function formatStatus(status: string) {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            BREADCRUMB
        ====================================================== */}

        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard/student"
            className="text-slate-500 transition hover:text-white"
          >
            Student Dashboard
          </Link>

          <span className="text-slate-700">
            /
          </span>

          <span className="text-slate-300">
            Help & Support
          </span>
        </div>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
            🎧 Campus ERP Support
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Help & Support
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Need assistance? Contact the concerned
            department through Campus ERP.
          </p>
        </section>

        {/* =====================================================
            DEPARTMENTS
        ====================================================== */}

        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Contact a Department
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the department related to your issue.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() =>
                  setDepartment(item.name)
                }
                className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${
                  department === item.name
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* =====================================================
            SUPPORT REQUEST + QUICK HELP
        ====================================================== */}

        <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

          {/* =================================================
              FORM
          ================================================== */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">

            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Submit a Support Request
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Describe your issue and the concerned
                department will assist you.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Department */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <select
                  value={department}
                  onChange={(event) =>
                    setDepartment(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Issue Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select issue category
                  </option>

                  <option value="technical">
                    Technical Issue
                  </option>

                  <option value="academic">
                    Academic Issue
                  </option>

                  <option value="fees">
                    Fees & Payment
                  </option>

                  <option value="examination">
                    Examination
                  </option>

                  <option value="hostel">
                    Hostel
                  </option>

                  <option value="library">
                    Library
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Describe Your Issue
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={6}
                  placeholder="Describe your problem in detail..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Success */}

              {successMessage && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  ✅ {successMessage}
                </div>
              )}

              {/* Error */}

              {errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting Request..."
                  : "Submit Support Request →"}
              </button>

            </form>
          </div>

          {/* =================================================
              QUICK HELP
          ================================================== */}

          <div className="space-y-6">

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-bold">
                Quick Help
              </h2>

              <div className="mt-5 space-y-4">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white">
                    📧 Campus ERP Support
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Get help with portal-related issues.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white">
                    🕐 Support Hours
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Monday – Friday, 9:00 AM – 4:00 PM
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white">
                    🚨 Emergency
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    For urgent campus matters, contact
                    the concerned college authority directly.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            MY SUPPORT REQUESTS
        ====================================================== */}

        <section className="mb-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              My Support Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track the support requests submitted by you.
            </p>
          </div>

          {/* Loading */}

          {ticketsLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                />
              ))}
            </div>
          )}

          {/* Empty */}

          {!ticketsLoading &&
            tickets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center">
                <div className="text-3xl">
                  🎫
                </div>

                <h3 className="mt-3 font-semibold text-white">
                  No support requests yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your submitted support requests will
                  appear here.
                </p>
              </div>
            )}

          {/* Tickets */}

          {!ticketsLoading &&
            tickets.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">

                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
                  >

                    {/* Ticket Header */}

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Support Request
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-white">
                          #{ticket.id}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {formatStatus(
                          ticket.status
                        )}
                      </span>

                    </div>

                    {/* Department + Category */}

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">

                      <div>
                        <p className="text-xs text-slate-500">
                          Department
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-300">
                          {ticket.department}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Category
                        </p>

                        <p className="mt-1 text-sm font-medium capitalize text-slate-300">
                          {ticket.category}
                        </p>
                      </div>

                    </div>

                    {/* Description */}

                    <div className="mt-5 border-t border-slate-800 pt-4">

                      <p className="text-xs text-slate-500">
                        Issue
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {ticket.description}
                      </p>

                    </div>

                    {/* Date */}

                    <div className="mt-5 text-xs text-slate-600">
                      Submitted{" "}
                      {formatDate(
                        ticket.created_at
                      )}
                    </div>

                  </div>
                ))}

              </div>
            )}

        </section>

        {/* =====================================================
            FAQ
        ====================================================== */}

        <section>

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Frequently Asked Questions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quick answers to common student questions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >

                <summary className="cursor-pointer list-none font-semibold text-white">
                  <div className="flex items-center justify-between gap-4">

                    <span>
                      {faq.question}
                    </span>

                    <span className="text-slate-500 transition group-open:rotate-45">
                      +
                    </span>

                  </div>
                </summary>

                <p className="mt-4 border-t border-slate-800 pt-4 text-sm leading-6 text-slate-400">
                  {faq.answer}
                </p>

              </details>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}