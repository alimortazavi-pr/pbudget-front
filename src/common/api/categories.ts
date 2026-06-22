import { axiosInstance } from "@/common/axiosInstance";
import type { ICategory } from "@/common/interfaces/category.interface";
import { normalizeCategory } from "@/common/utils/category-tree";

export async function fetchCategories(token?: string) {
  const { data } = await axiosInstance.get<{ categories: ICategory[] }>(
    "/categories",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return data.categories.map(normalizeCategory);
}

export async function createCategory(payload: {
  title: string;
  parentId?: string | null;
  kind?: "default" | "project";
  color?: string;
  monthlyLimit?: string | number;
}) {
  const { data } = await axiosInstance.post("/categories", payload);
  return normalizeCategory(data.category as ICategory);
}

export async function updateCategory(
  id: string,
  payload: {
    title: string;
    parentId?: string | null;
    kind?: "default" | "project";
    color?: string;
    monthlyLimit?: string | number;
  },
) {
  const { data } = await axiosInstance.put(`/categories/${id}`, payload);
  return normalizeCategory(data.category as ICategory);
}

export async function softDeleteCategory(id: string) {
  await axiosInstance.delete(`/categories/${id}/soft`);
}
