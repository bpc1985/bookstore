"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Input } from "@bookstore/ui";
import { Label } from "@bookstore/ui";
import { Textarea } from "@bookstore/ui";
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
import type { Book, Category } from "@bookstore/types";
import { toast } from "sonner";

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    price: "",
    stock: "",
    description: "",
    cover_image: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookData, categoriesData] = await Promise.all([
          api.getBook(parseInt(id)),
          api.getCategories(),
        ]);
        setBook(bookData);
        setCategories(categoriesData);
        setFormData({
          title: bookData.title,
          author: bookData.author,
          isbn: bookData.isbn || "",
          price: bookData.price.toString(),
          stock: bookData.stock_quantity.toString(),
          description: bookData.description || "",
          cover_image: bookData.cover_image || "",
        });
        setSelectedCategories(bookData.categories?.map(c => c.id) || []);
      } catch {
        toast.error("Failed to load book data");
        router.push("/books");
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await api.updateBook(parseInt(id), {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        price: formData.price,
        stock_quantity: parseInt(formData.stock) || 0,
        description: formData.description || undefined,
        cover_image: formData.cover_image || undefined,
        category_ids: selectedCategories,
      } as any);
      toast.success("Book updated successfully");
      router.push(`/books/${id}`);
    } catch {
      toast.error("Failed to update book");
    } finally {
      setIsLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/books/${book.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
          <p className="text-sm text-muted-foreground">
            Editing &quot;{book.title}&quot;
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Enter ISBN (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categories">Category</Label>
                <Select
                  value={selectedCategories.length > 0 ? selectedCategories[0].toString() : ""}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedCategories([parseInt(value)]);
                    } else {
                      setSelectedCategories([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter book description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="Enter cover image URL (optional)"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/books/${book.id}`}>
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
