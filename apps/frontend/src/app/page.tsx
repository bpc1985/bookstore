"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  ShoppingCart,
  Star,
  Truck,
  Sparkles,
  BookMarked,
  Library,
  Heart,
  Compass,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { BookListItem, Category } from "@bookstore/types";
import { useAuthStore } from "@/stores/auth";

const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Fiction: BookMarked,
  "Non-Fiction": Library,
  Romance: Heart,
  Adventure: Compass,
  Science: GraduationCap,
  default: BookOpen,
};

function BookCard({ book, index }: { book: BookListItem; index: number }) {
  const coverImage =
    book.cover_image || BOOK_COVERS[index % BOOK_COVERS.length];

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative overflow-hidden">
            <Image
              src={coverImage}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                className="w-full bg-white/90 text-foreground hover:bg-white"
              >
                View Details
              </Button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-primary">
                ${book.price}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {parseFloat(book.rating).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function BookSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-0">
      <CardContent className="p-0">
        <Skeleton className="aspect-[2/3] w-full" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [featuredBooks, setFeaturedBooks] = useState<BookListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [booksRes, catsRes] = await Promise.all([
          api.getBooks({ size: 8, sort_by: "rating", sort_order: "desc" }),
          api.getCategories(),
        ]);
        setFeaturedBooks(booksRes.items);
        setCategories(catsRes.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/30 to-secondary/50" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-[0.03]" />
        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-1.5 text-sm font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Over 10,000+ books available
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Discover Your Next
                <span className="text-primary block">Favorite Book</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Explore our curated collection of bestsellers, classics, and
                hidden gems. Find your perfect read and embark on your next
                literary adventure.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/books">
                  <Button
                    size="lg"
                    className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Browse Collection
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {!user && (
                  <Link href="/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white/50 backdrop-blur-sm"
                    >
                      Join Free
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Image
                      src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
                      alt="Book cover"
                      width={192}
                      height={256}
                      className="rounded-2xl shadow-2xl object-cover"
                    />
                    <Image
                      src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
                      alt="Book cover"
                      width={192}
                      height={256}
                      className="rounded-2xl shadow-2xl object-cover ml-8"
                    />
                  </div>
                  <div className="space-y-4 pt-8">
                    <Image
                      src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop"
                      alt="Book cover"
                      width={192}
                      height={256}
                      className="rounded-2xl shadow-2xl object-cover"
                    />
                    <Image
                      src="https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop"
                      alt="Book cover"
                      width={192}
                      height={256}
                      className="rounded-2xl shadow-2xl object-cover ml-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-y bg-card/50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  On orders over $50
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">
                  30-day return policy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Curated Selection</h3>
                <p className="text-sm text-muted-foreground">
                  Hand-picked quality books
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
              <p className="text-muted-foreground">
                Find books in your favorite genres
              </p>
            </div>
            <Link href="/books">
              <Button variant="ghost" className="hidden sm:flex">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => {
              const IconComponent =
                CATEGORY_ICONS[category.name] || CATEGORY_ICONS["default"];
              return (
                <Link
                  key={category.id}
                  href={`/books?category_id=${category.id}`}
                >
                  <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {category.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Books</h2>
              <p className="text-muted-foreground">
                Our top-rated selections for you
              </p>
            </div>
            <Link href="/books">
              <Button variant="ghost" className="hidden sm:flex">
                View All Books
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <BookSkeleton key={i} />
                ))
              : featuredBooks.map((book, index) => (
                  <BookCard key={book.id} book={book} index={index} />
                ))}
          </div>
          <div className="text-center mt-10 sm:hidden">
            <Link href="/books">
              <Button variant="outline">
                View All Books
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/90 to-primary">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920')] bg-cover bg-center opacity-10" />
            <CardContent className="relative py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
                Ready to Start Reading?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Create an account today and get access to exclusive deals,
                personalized recommendations, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="shadow-lg">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/books">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Browse Books
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
