"use client";

import { createCartStore } from "@bookstore/stores";
import { api } from "@/lib/api";

export const useCartStore = createCartStore();
