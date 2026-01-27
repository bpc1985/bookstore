import { ApiClient } from '@bookstore/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = new ApiClient({ baseUrl: API_URL });
