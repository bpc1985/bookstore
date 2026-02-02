'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Minus, Plus, ShoppingCart, Star, Check, ArrowLeft, Share2, Heart } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { reviewSchema } from '@/lib/schemas';
import { useCreateReviewMutation } from '@/lib/hooks';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { toast } from 'sonner';
import type { Book, BookListItem, Review, PaginatedResponse } from '@/types';

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=900&fit=crop',
];

function StarRating({ rating, onRate, size = 'md' }: { rating: number; onRate?: (r: number) => void; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className={`${onRate ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            className={`${sizeClass} ${
              star <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem, isLoading: cartLoading } = useCartStore();
  const [book, setBook] = useState<Book | null>(null);
  const [recommendations, setRecommendations] = useState<BookListItem[]>([]);
  const [reviews, setReviews] = useState<PaginatedResponse<Review> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const bookId = parseInt(params.id as string);
  const createReviewMutation = useCreateReviewMutation(bookId);

  const reviewForm = useForm({
    defaultValues: {
      rating: 5,
      comment: '',
    },
    validators: {
      onSubmit: reviewSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        await createReviewMutation.mutateAsync(value);
        toast.success('Review submitted!');
        reviewForm.reset();
        const [reviewsData, bookData] = await Promise.all([
          api.getBookReviews(bookId),
          api.getBook(bookId),
        ]);
        setReviews(reviewsData);
        setBook(bookData);
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [bookData, recsData, reviewsData] = await Promise.all([
          api.getBook(bookId),
          api.getBookRecommendations(bookId),
          api.getBookReviews(bookId),
        ]);
        setBook(bookData);
        setRecommendations(recsData);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Failed to fetch book:', error);
        toast.error('Failed to load book');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [bookId]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await addItem(api, bookId, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const coverImage = book?.cover_image || BOOK_COVERS[bookId % BOOK_COVERS.length];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-[2/3] w-full max-w-md rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Book not found</h1>
            <p className="text-muted-foreground mb-6">The book you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/books">
              <Button>Browse Books</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container py-8">
        {/* Back Button */}
        <Link href="/books" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>

        {/* Book Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Book Image */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative max-w-md mx-auto md:mx-0">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
                <div className="relative aspect-[2/3] w-full">
                  <Image
                    src={coverImage}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover rounded-2xl shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Book Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {book.categories.map((cat) => (
                <Link key={cat.id} href={`/books?category_id=${cat.id}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">{book.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">by {book.author}</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-amber-700 dark:text-amber-400">{parseFloat(book.rating).toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({book.review_count} reviews)</span>
            </div>

            <div className="text-4xl font-bold text-primary mb-6">${book.price}</div>

            {book.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{book.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span className="text-sm text-muted-foreground">ISBN: {book.isbn}</span>
              {book.stock_quantity > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  In Stock ({book.stock_quantity} available)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {book.stock_quantity > 0 && (
              <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex items-center justify-center border rounded-xl bg-muted/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-12 w-12 rounded-l-xl rounded-r-none"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-14 text-center font-semibold text-lg">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.min(book.stock_quantity, quantity + 1))}
                        disabled={quantity >= book.stock_quantity}
                        className="h-12 w-12 rounded-r-xl rounded-l-none"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      size="lg"
                      className="flex-1 h-12 shadow-lg shadow-primary/25"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* Reviews Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

            {reviews && reviews.items.length > 0 ? (
              <div className="space-y-4">
                {reviews.items.map((review) => (
                  <Card key={review.id} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {review.reviewer_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold">{review.reviewer_name}</span>
                              {review.is_verified_purchase && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="mt-3 text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="border-0 shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      reviewForm.handleSubmit();
                    }}
                    className="space-y-4"
                  >
                    <reviewForm.Field name="rating">
                      {(field) => (
                        <div>
                          <label className="text-sm font-medium mb-3 block">Your Rating</label>
                          <StarRating
                            rating={field.state.value}
                            onRate={(r) => field.handleChange(r)}
                          />
                          {field.state.meta.errors[0] && (
                            <p className="text-sm text-destructive mt-1">
                              {typeof field.state.meta.errors[0] === 'string'
                                ? field.state.meta.errors[0]
                                : field.state.meta.errors[0].message}
                            </p>
                          )}
                        </div>
                      )}
                    </reviewForm.Field>
                    <reviewForm.Field name="comment">
                      {(field) => (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Your Review</label>
                          <Textarea
                            placeholder="Share your thoughts about this book..."
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            rows={4}
                            className="resize-none bg-muted/50 border-0"
                          />
                        </div>
                      )}
                    </reviewForm.Field>
                    <Button type="submit" disabled={createReviewMutation.isPending} className="w-full">
                      {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">Please log in to write a review</p>
                    <Link href="/login">
                      <Button className="w-full">Log In</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <>
            <Separator className="my-12" />
            <div>
              <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map((rec, index) => {
                  const recCover = rec.cover_image || BOOK_COVERS[(rec.id + index) % BOOK_COVERS.length];
                  return (
                    <Link key={rec.id} href={`/books/${rec.id}`}>
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-card shadow-sm">
                        <CardContent className="p-0">
                          <div className="aspect-[2/3] relative overflow-hidden">
                            <Image
                              src={recCover}
                              alt={rec.title}
                              fill
                              sizes="(max-width: 768px) 50vw, 20vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{rec.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{rec.author}</p>
                            <p className="font-semibold text-primary mt-2">${rec.price}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
