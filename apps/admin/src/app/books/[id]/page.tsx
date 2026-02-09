"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@bookstore/ui";
import { Badge } from "@bookstore/ui";
import { Skeleton } from "@bookstore/ui";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Book } from "@bookstore/types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bookstore/ui";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function loadBook() {
      setIsLoading(true);
      try {
        const data = await api.getBook(parseInt(id));
        setBook(data);
      } catch {
        toast.error("Failed to load book");
      } finally {
        setIsLoading(false);
      }
    }
    loadBook();
  }, [id]);

  const handleDelete = async () => {
    if (!book) return;

    try {
      await api.deleteBook(book.id);
      toast.success("Book deleted successfully");
      setDeleteDialogOpen(false);
      window.location.href = "/books";
    } catch {
      toast.error("Failed to delete book");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">Book not found</p>
        <Link href="/books">
          <Button>Back to Books</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/books">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/books/${book.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Book Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Title", value: book.title },
              { label: "Author", value: book.author },
              { label: "ISBN", value: book.isbn || "N/A" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-medium">{item.value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Price</p>
              <p className="mt-0.5 text-2xl font-bold">${parseFloat(String(book.price)).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</p>
              <Badge variant="secondary" className={`mt-1 font-normal ${book.stock_quantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {book.stock_quantity} {book.stock_quantity > 0 ? "in stock" : "out of stock"}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
              <Badge variant={book.is_deleted ? "destructive" : "secondary"} className={`mt-1 font-normal ${!book.is_deleted ? "bg-emerald-100 text-emerald-700" : ""}`}>
                {book.is_deleted ? "Deleted" : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {book.categories && book.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {book.categories.map((cat) => (
                  <Badge key={cat.id} variant="secondary">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{book.description || "No description"}</p>
        </CardContent>
      </Card>

      {/* Cover Image */}
      {book.cover_image && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={book.cover_image}
              alt={book.title}
              className="max-w-md rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardContent className="flex gap-6 py-4 text-sm text-muted-foreground">
          <p>Published on {new Date(book.created_at).toLocaleDateString()}</p>
          <p>Last updated {new Date(book.updated_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{book.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
