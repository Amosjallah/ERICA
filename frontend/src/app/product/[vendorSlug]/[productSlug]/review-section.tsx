"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Review = {
  _id: string;
  rating: number;
  comment: string;
  user: { name: string };
  createdAt: string;
};

export function ReviewSection({ productId }: { productId: string }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    apiFetch<Review[]>(`/reviews/product/${productId}`)
      .then(setReviews)
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ product: productId, rating, comment }),
        token,
      });
      toast.success("Review submitted");
      setComment("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Reviews</h2>
      {user && (
        <form onSubmit={submit} className="mt-6 max-w-xl space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-amber-100 dark:bg-amber-600 dark:text-neutral-950"
          >
            Submit review
          </button>
        </form>
      )}
      <ul className="mt-8 space-y-4">
        {reviews.map((r) => (
          <li key={r._id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{r.user?.name}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">★ {r.rating}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{r.comment}</p>
          </li>
        ))}
        {reviews.length === 0 && <p className="text-sm text-zinc-500">No reviews yet.</p>}
      </ul>
    </section>
  );
}
