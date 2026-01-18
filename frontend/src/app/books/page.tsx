'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Filter, Search, Star, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import type { BookListItem, Category, PaginatedResponse } from '@/types';

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop',
];

function BookCard({ book, index }: { book: BookListItem; index: number }) {
  const coverImage = book.cover_image || BOOK_COVERS[index % BOOK_COVERS.length];

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative overflow-hidden bg-muted">
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {book.stock_quantity === 0 && (
              <div className="absolute top-3 left-3">
                <Badge variant="destructive" className="shadow-lg">Out of Stock</Badge>
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="sm" className="w-full bg-white/90 text-foreground hover:bg-white">
                View Details
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              {book.categories.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                  {cat.name}
                </Badge>
              ))}
            </div>
            <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">{book.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-primary">${book.price}</span>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{parseFloat(book.rating).toFixed(1)}</span>
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
    <Card className="h-full overflow-hidden border-0 shadow-sm">
      <CardContent className="p-0">
        <Skeleton className="aspect-[2/3] w-full" />
        <div className="p-4 space-y-2">
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-6 w-1/3 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function BooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [books, setBooks] = useState<PaginatedResponse<BookListItem> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const categoryId = searchParams.get('category_id');
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    async function fetchBooks() {
      setIsLoading(true);
      try {
        const result = await api.getBooks({
          search: searchParams.get('search') || undefined,
          category_id: categoryId ? parseInt(categoryId) : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          size: 12,
        });
        setBooks(result);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooks();
  }, [searchParams, categoryId, sortBy, sortOrder, page]);

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`/books?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams('search', searchTerm || null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    router.push('/books');
  };

  const selectedCategory = categories.find((c) => c.id === parseInt(categoryId || '0'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Page Header */}
      <div className="bg-card border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Browse Books</h1>
          <p className="text-muted-foreground">Discover your next great read from our collection</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParams('category_id', null)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        !categoryId
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams('category_id', cat.id.toString())}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          categoryId === cat.id.toString()
                            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Filters */}
            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title or author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
                      />
                    </div>
                    <Button type="submit" className="shrink-0">
                      Search
                    </Button>
                  </form>

                  <div className="flex gap-2">
                    {/* Mobile Filter */}
                    <Sheet>
                      <SheetTrigger asChild className="md:hidden">
                        <Button variant="outline" className="shrink-0">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Categories
                          </SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-1">
                          <button
                            onClick={() => {
                              updateParams('category_id', null);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                              !categoryId
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-muted'
                            }`}
                          >
                            All Categories
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                updateParams('category_id', cat.id.toString());
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                                categoryId === cat.id.toString()
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [sb, so] = value.split('-');
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('sort_by', sb);
                        params.set('sort_order', so);
                        params.delete('page');
                        router.push(`/books?${params.toString()}`);
                      }}
                    >
                      <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating-desc">Highest Rated</SelectItem>
                        <SelectItem value="title-asc">Title: A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters */}
            {(selectedCategory || searchParams.get('search')) && (
              <div className="flex items-center flex-wrap gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1">
                    {selectedCategory.name}
                    <button
                      onClick={() => updateParams('category_id', null)}
                      className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchParams.get('search') && (
                  <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1">
                    &quot;{searchParams.get('search')}&quot;
                    <button
                      onClick={() => updateParams('search', null)}
                      className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  Clear all
                </Button>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <BookSkeleton key={i} />
                ))}
              </div>
            ) : books && books.items.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-5">
                  Showing <span className="font-medium text-foreground">{books.items.length}</span> of{' '}
                  <span className="font-medium text-foreground">{books.total}</span> books
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {books.items.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {books.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      onClick={() => updateParams('page', (page - 1).toString())}
                      disabled={page === 1}
                      className="px-6"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-4">
                      {Array.from({ length: Math.min(5, books.pages) }, (_, i) => {
                        let pageNum: number;
                        if (books.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= books.pages - 2) {
                          pageNum = books.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateParams('page', pageNum.toString())}
                            className="w-9 h-9"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => updateParams('page', (page + 1).toString())}
                      disabled={page === books.pages}
                      className="px-6"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No books found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filters to find what you&apos;re looking for
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="bg-card border-b">
          <div className="container py-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}
