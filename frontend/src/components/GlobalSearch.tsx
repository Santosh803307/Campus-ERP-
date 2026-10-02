"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    globalSearch,
    SearchResult,
} from "@/services/searchService";

export default function GlobalSearch() {
    const router = useRouter();

    const wrapperRef =
        useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] =
        useState<SearchResult[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [showResults, setShowResults] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==================================================
    // SEARCH
    // ==================================================

    useEffect(() => {
        const searchQuery = query.trim();

        if (searchQuery.length < 2) {
            setResults([]);
            setShowResults(false);
            setError("");
            return;
        }

        const timer = setTimeout(
            async () => {
                try {
                    setLoading(true);
                    setError("");
                    setShowResults(true);

                    const response =
                        await globalSearch(searchQuery);

                    setResults(
                        response.results
                    );
                } catch (err) {
                    console.error(
                        "Global search error:",
                        err
                    );

                    setError(
                        "Unable to search right now."
                    );

                    setResults([]);
                } finally {
                    setLoading(false);
                }
            },
            300
        );

        return () => {
            clearTimeout(timer);
        };
    }, [query]);

    // ==================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // ==================================================

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(
                    event.target as Node
                )
            ) {
                setShowResults(false);
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

    // ==================================================
    // RESULT NAVIGATION
    // ==================================================

    const handleResultClick = (
        result: SearchResult
    ) => {
        setShowResults(false);
        setQuery("");

        switch (result.type) {
            case "student":
                router.push(
                    `/dashboard/admin/students/${result.id}`
                );
                break;

            case "user":
                router.push(
                    "/dashboard/admin/students"
                );
                break;

            case "fee_structure":
            case "student_fee":
            case "payment":
                router.push(
                    "/dashboard/admin/fees"
                );
                break;

            case "no_dues":
                router.push(
                    "/dashboard/admin/no-dues"
                );
                break;

            case "out_pass":
                router.push(
                    "/dashboard/admin/hostel"
                );
                break;

            default:
                break;
        }
    };

    // ==================================================
    // RESULT ICON
    // ==================================================

    const getIcon = (
        type: SearchResult["type"]
    ) => {
        switch (type) {
            case "student":
                return "👨‍🎓";

            case "user":
                return "👤";

            case "fee_structure":
            case "student_fee":
                return "💰";

            case "payment":
                return "💳";

            case "no_dues":
                return "📄";

            case "out_pass":
                return "🏠";

            default:
                return "🔎";
        }
    };

    return (
        <div
            ref={wrapperRef}
            className="relative w-full max-w-xl"
        >
            {/* SEARCH INPUT */}

            <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    🔎
                </span>

                <input
                    type="text"
                    value={query}
                    onChange={(event) =>
                        setQuery(event.target.value)
                    }
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setShowResults(true);
                        }
                    }}
                    placeholder="Search students, users, fees..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                {/* CLEAR */}

                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setShowResults(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* RESULTS */}

            {showResults && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

                    {/* LOADING */}

                    {loading && (
                        <div className="px-5 py-4 text-sm text-slate-400">
                            Searching...
                        </div>
                    )}

                    {/* ERROR */}

                    {!loading && error && (
                        <div className="px-5 py-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* NO RESULTS */}

                    {!loading &&
                        !error &&
                        results.length === 0 && (
                            <div className="px-5 py-6 text-center">
                                <p className="text-2xl">
                                    🔎
                                </p>

                                <p className="mt-2 text-sm font-medium text-white">
                                    No results found
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Try another name, email,
                                    enrollment number or status.
                                </p>
                            </div>
                        )}

                    {/* RESULT LIST */}

                    {!loading &&
                        !error &&
                        results.length > 0 && (
                            <div className="max-h-96 overflow-y-auto">

                                {results.map(
                                    (result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            type="button"
                                            onClick={() =>
                                                handleResultClick(
                                                    result
                                                )
                                            }
                                            className="flex w-full items-center gap-4 border-b border-slate-800 px-5 py-4 text-left transition last:border-b-0 hover:bg-slate-800"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg">
                                                {getIcon(
                                                    result.type
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {result.title}
                                                </p>

                                                <p className="mt-1 truncate text-xs text-slate-400">
                                                    {result.subtitle}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                                                {result.type.replace(
                                                    "_",
                                                    " "
                                                )}
                                            </span>
                                        </button>
                                    )
                                )}

                            </div>
                        )}

                </div>
            )}
        </div>
    );
}