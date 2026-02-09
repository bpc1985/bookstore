"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Input } from "@bookstore/ui";
import { Label } from "@bookstore/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@bookstore/ui";
import { Skeleton } from "@bookstore/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookstore/ui";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import type { Category as BaseCategory } from "@bookstore/types";

interface Category extends BaseCategory {
  parent_id?: number | null;
}
import { toast } from "sonner";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [categoryData, categoriesData] = await Promise.all([
          api.getCategories().then(cats => cats.find(c => c.id === parseInt(id))!) as Promise<Category>,
          api.getCategories() as Promise<Category[]>,
        ]);
        setCategory(categoryData);
        setCategories(categoriesData);
        setFormData({
          name: categoryData.name,
          parent_id: categoryData.parent_id?.toString() || "",
        });
      } catch {
        toast.error("Failed to load category data");
        router.push("/categories");
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a category name");
      return;
    }

    const newParentId = formData.parent_id ? parseInt(formData.parent_id) : null;

    // Check for circular hierarchy
    if (newParentId && newParentId === parseInt(id)) {
      toast.error("Cannot set a category as its own parent");
      return;
    }

    // Check if new parent is a descendant
    const isDescendant = (catId: number, parentId: number): boolean => {
      if (catId === parentId) return true;
      const child = categories.find(c => c.parent_id === catId);
      if (child) {
        return isDescendant(child.id!, parentId);
      }
      return false;
    };

    if (newParentId && category && isDescendant(category.id, newParentId)) {
      toast.error("Cannot create circular category hierarchy");
      return;
    }

    setIsLoading(true);
    try {
      await api.updateCategory(parseInt(id), {
        name: formData.name,
        parent_id: newParentId,
      });
      toast.success("Category updated successfully");
      router.push("/categories");
    } catch {
      toast.error("Failed to update category");
    } finally {
      setIsLoading(false);
    }
  };

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Card className="max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-sm text-muted-foreground">
            Editing &quot;{category.name}&quot;
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level category)</SelectItem>
                  {categories
                    .filter(cat => cat.id !== category.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/categories">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
