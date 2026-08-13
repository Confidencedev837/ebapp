// src/hooks/useReviews.ts
import React, { useState, useCallback, useEffect } from 'react';
import { Review } from '@/types';
import * as reviewsApi from '@/services/api/reviewsApi';

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

/**
 * Hook for fetching reviews for a service
 */
export const useReviews = (serviceId: string | null) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.fetchServiceReviews(serviceId);
      setReviews(data as unknown as Review[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { reviews, loading, error, refetch: fetch };
};

/**
 * Hook for fetching service rating
 */
export const useServiceRating = (serviceId: string | null) => {
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.fetchServiceRating(serviceId);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rating';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
};

/**
 * Hook for creating a review
 */
export const useCreateReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(
    async (data: {
      customerId: string;
      serviceId: string;
      rating: number;
      comment?: string;
    }): Promise<Review | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await reviewsApi.createReview({
          customer_id: data.customerId,
          service_id: data.serviceId,
          rating: data.rating,
          comment: data.comment || null,
        });
        return result as unknown as Review;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create review';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createReview, loading, error };
};

/**
 * Hook for checking if customer already reviewed a service
 */
export const useHasReviewed = (customerId: string | null, serviceId: string | null) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!customerId || !serviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await reviewsApi.hasCustomerReviewedService(customerId, serviceId);
      setHasReviewed(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check review';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [customerId, serviceId]);

  React.useEffect(() => {
    check();
  }, [check]);

  return { hasReviewed, loading, error };
};

/**
 * Hook for updating a review
 */
export const useUpdateReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReview = useCallback(
    async (reviewId: string, rating: number, comment: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const result = await reviewsApi.updateReview(reviewId, rating, comment);
        return result as unknown as Review;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update review';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateReview, loading, error };
};

/**
 * Hook for deleting a review
 */
export const useDeleteReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      setLoading(true);
      setError(null);
      await reviewsApi.deleteReview(reviewId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete review';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteReview, loading, error };
};
