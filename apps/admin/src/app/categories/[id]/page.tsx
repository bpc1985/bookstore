"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash2, FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import type { Category as BaseCategory, BookListItem } from "@bookstore/types";

interface Category extends BaseCategory {
  parent_id?: number | null;
}
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [categoryData] = await Promise.all([
          api.getCategories().then(cats => cats.find(c => c.id === parseInt(id))!) as Promise<Category>,
        ]);
        setCategory(categoryData);

        // Load books for this category
        const booksData = await api.getBooks({ category_id: parseInt(id), size: 100 });
        setBooks(booksData.items);
      } catch {
        toast.error("Failed to load category data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!category) return;

    try {
      await api.deleteCategory(category.id);
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      window.location.href = "/categories";
    } catch {
      toast.error("Failed to delete category");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-20" />
          </CardContent></Card>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">Category not found</p>
        <Link href="/categories">
          <Button>Back to Categories</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/categories">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            <p className="text-sm text-muted-foreground">Category details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/categories/${category.id}/edit`}>
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

      {/* Category Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
              <p className="mt-0.5 font-medium">{category.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</p>
              <p className="mt-0.5 font-medium flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                {category.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Parent Category</p>
              <p className="mt-0.5 font-medium">
                {category.parent_id ? `ID: ${category.parent_id}` : "None (top-level)"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created At</p>
              <p className="mt-0.5 font-medium">
                {new Date(category.created_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Books in this Category</p>
              <p className="mt-1 text-3xl font-bold">{books.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books in Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Books in this Category</CardTitle>
        </CardHeader>
        <CardContent>
          {books.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className="block">
                  <div className="rounded-lg border p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-sm font-medium mt-1">${parseFloat(String(book.price)).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <FolderTree className="h-8 w-8 mb-2" />
              <p>No books in this category</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be undone.
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
