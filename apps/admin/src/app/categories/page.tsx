"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Card } from "@bookstore/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookstore/ui";
import { Skeleton } from "@bookstore/ui";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import type { Category as BaseCategory } from "@bookstore/types";

interface Category extends BaseCategory {
  parent_id?: number | null;
  has_children?: boolean;
  book_count?: number;
}
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bookstore/ui";

export default function CategoriesListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);
      try {
        const data = await api.getCategories() as Category[];
        setCategories(data);
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    }
    loadCategories();
  }, []);

  const getCategoryPath = (cat: Category): string => {
    if (!cat.parent_id) return cat.name;
    const parent = categories.find(c => c.id === cat.parent_id);
    if (parent) {
      return `${getCategoryPath(parent)} > ${cat.name}`;
    }
    return cat.name;
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await api.deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const hasChildren = (cat: Category): boolean => {
    return categories.some(c => c.parent_id === cat.id);
  };

  const getBookCount = (cat: Category): number => {
    return categories.filter(c => c.parent_id === cat.id).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your books into categories
          </p>
        </div>
        <Link href="/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Children</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderTree className="h-8 w-8" />
                    <p>No categories found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-muted-foreground">{category.id}</TableCell>
                  <TableCell>
                    <Link href={`/categories/${category.id}`} className="flex items-center gap-2 font-medium hover:underline">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                      {category.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.parent_id ? (
                      getCategoryPath(categories.find(c => c.id === category.parent_id)!)
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getBookCount(category)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/categories/${category.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={hasChildren(category)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {categoryToDelete?.has_children ? (
                <>
                  This category has sub-categories. Deleting it will also delete all sub-categories. Are you sure you want to delete &quot;{categoryToDelete.name}&quot;?
                </>
              ) : categoryToDelete?.book_count ? (
                <>
                  This category contains {categoryToDelete.book_count} books. Deleting it will remove this category from all associated books. Are you sure?
                </>
              ) : (
                <>
                  Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
                </>
              )}
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
