"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Check, X, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import type { Review as BaseReview } from "@bookstore/types";

interface Review extends BaseReview {
  book_title?: string;
  user_name?: string;
}
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const data = await api.listPendingReviews(page, 20);
        setReviews(data.items);
        setTotalPages(Math.ceil(data.total / 20));
      } catch {
        toast.error("Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [page]);

  const handleApprove = () => {
    if (!selectedReview) return;

    api.approveReview(selectedReview.id, true)
      .then(() => {
        toast.success("Review approved");
        setActionDialogOpen(false);
        setSelectedReview(null);
        setReviews(reviews.filter(r => r.id !== selectedReview.id));
      })
      .catch(() => {
        toast.error("Failed to approve review");
      });
  };

  const handleReject = () => {
    if (!selectedReview) return;

    api.approveReview(selectedReview.id, false)
      .then(() => {
        toast.success("Review rejected");
        setActionDialogOpen(false);
        setSelectedReview(null);
        setReason("");
        setReviews(reviews.filter(r => r.id !== selectedReview.id));
      })
      .catch(() => {
        toast.error("Failed to reject review");
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-44" />
          </div>
        </Card>
        <Card>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject pending customer reviews
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by book title or user email..."
              className="pl-10"
            />
          </div>
          <Select value={ratingFilter || "all"} onValueChange={(value) => setRatingFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="low">1-2 Stars</SelectItem>
              <SelectItem value="medium">3 Stars</SelectItem>
              <SelectItem value="high">4-5 Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Book Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-8 w-8" />
                    <p>No pending reviews</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-muted-foreground">{review.id}</TableCell>
                  <TableCell className="font-medium">{review.book_title || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">{review.user_name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {review.comment || "No comment"}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {
                          setSelectedReview(review);
                          setActionType("approve");
                          setActionDialogOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedReview(review);
                          setActionType("reject");
                          setReason("");
                          setActionDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                </span>
              );
            })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Review" : "Reject Review"}
            </DialogTitle>
            <DialogDescription>
              {selectedReview && (
                <>
                  {actionType === "approve" ? (
                    <>
                      Approve review for &quot;{selectedReview.book_title}&quot; by {selectedReview.user_name}?
                      This review will be visible to all users.
                    </>
                  ) : (
                    <>
                      Reject review for &quot;{selectedReview.book_title}&quot; by {selectedReview.user_name}?
                      This review will not be visible to users.
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you rejecting this review?"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={actionType === "approve" ? handleApprove : handleReject}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {actionType === "approve" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
