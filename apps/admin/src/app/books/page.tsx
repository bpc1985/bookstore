"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Input } from "@bookstore/ui";
import { Card } from "@bookstore/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookstore/ui";
import { Badge } from "@bookstore/ui";
import { Skeleton } from "@bookstore/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookstore/ui";
import { Search, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import type { BookListItem as BaseBookListItem, Category, PaginatedResponse } from "@bookstore/types";

interface BookListItem extends BaseBookListItem {
  is_deleted?: boolean;
}
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bookstore/ui";

export default function BooksListPage() {
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<BookListItem | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch {
        toast.error("Failed to load categories");
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true);
      try {
        const data = await api.getBooks({
          search: search || undefined,
          category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
          page,
          size: 20,
        });
        setBooks(data.items);
        setTotalPages(Math.ceil(data.total / 20));
      } catch {
        toast.error("Failed to load books");
      } finally {
        setIsLoading(false);
      }
    }
    loadBooks();
  }, [search, selectedCategory, page]);

  const handleDelete = async () => {
    if (!bookToDelete) return;

    try {
      await api.deleteBook(bookToDelete.id);
      toast.success("Book deleted successfully");
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      setBooks(books.filter(b => b.id !== bookToDelete.id));
    } catch {
      toast.error("Failed to delete book");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>
        <Card>
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Books</h1>
          <p className="text-sm text-muted-foreground">
            Manage your book inventory
          </p>
        </div>
        <Link href="/books/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
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
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                    <p>No books found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              books.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-muted-foreground">{book.id}</TableCell>
                  <TableCell>
                    <Link href={`/books/${book.id}`} className="font-medium hover:underline">
                      {book.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{book.author}</TableCell>
                  <TableCell>${parseFloat(String(book.price)).toFixed(2)}</TableCell>
                  <TableCell>{book.stock_quantity}</TableCell>
                  <TableCell>
                    {book.is_deleted ? (
                      <Badge variant="destructive" className="font-normal">Deleted</Badge>
                    ) : book.stock_quantity > 0 ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-normal">In Stock</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-normal">Out of Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/books/${book.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setBookToDelete(book);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{bookToDelete?.title}&quot;? This action cannot be undone.
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
