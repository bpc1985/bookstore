export class PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;

  static create<T>(
    items: T[],
    total: number,
    page: number,
    size: number,
  ): PaginatedResponse<T> {
    const response = new PaginatedResponse<T>();
    response.items = items;
    response.total = total;
    response.page = page;
    response.size = size;
    response.pages = size > 0 ? Math.ceil(total / size) : 0;
    return response;
  }
}
