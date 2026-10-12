"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import Stars from "@/components/Stars";
import { useAppContext } from "@/context/AppContext";

const ProductReviews = ({ productId }) => {
  const { user, fetchProductData } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/review?productId=${productId}`);
      if (data.success) setReviews(data.reviews);
    } catch {
      /* A failed review fetch must not break the product page. */
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (rating === 0) {
      toast.error("Choose a star rating first");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/review", { productId, rating, comment });

      if (data.success) {
        toast.success(data.message);
        setComment("");
        setRating(0);
        await load();
        /* Refresh the catalogue so the card's average updates too. */
        fetchProductData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the review");
    } finally {
      setSubmitting(false);
    }
  };

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-2xl font-medium text-gray-800">Reviews</h2>
        {reviews.length > 0 && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Stars value={average} />
            {average} out of 5 · {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      {user ? (
        <form onSubmit={onSubmit} className="mt-6 max-w-xl">
          <fieldset>
            <legend className="text-sm text-gray-600 mb-2">Your rating</legend>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  aria-pressed={rating === value}
                  className="p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={value <= rating ? "text-orange-500" : "text-gray-300"}
                  >
                    <path d="M12 2l2.9 6.26 6.6.72-4.9 4.6 1.32 6.42L12 16.9l-5.92 3.1L7.4 13.6 2.5 9l6.6-.72L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </fieldset>

          <textarea
            rows={4}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What stood out, good or bad? (optional)"
            className="w-full mt-4 px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500 resize-y"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 px-8 py-2.5 bg-orange-700 text-white rounded-full font-medium hover:bg-orange-800 transition disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Submit review"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            You can review a product once. Submitting again updates your review.
          </p>
        </form>
      ) : (
        <p className="mt-4 text-gray-600">
          <Link href="/login" className="text-orange-700 hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-6 max-w-2xl">
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first.</p>
        ) : (
          reviews.map((review) => (
            <article key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Stars value={review.rating} />
                <span className="font-medium text-gray-900 text-sm">{review.name}</span>
                {review.verified && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    Verified purchase
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
