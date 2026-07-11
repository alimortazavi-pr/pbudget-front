import { getTranslator } from "@/i18n";
const t = getTranslator();
import type { ICategory } from "@/common/interfaces/category.interface";
import type { FormSelectOption } from "@/components/common/form/FormFields";

export type CategoryTreeNode = ICategory & { children: CategoryTreeNode[] };

export function getCategoryParentId(category: ICategory): string | null {
  if (!category.parent) return null;
  if (typeof category.parent === "string") return category.parent;
  return category.parent._id ?? null;
}

export function normalizeCategory(category: ICategory): ICategory {
  return {
    ...category,
    parent: getCategoryParentId(category),
  };
}

export function buildCategoryTree(categories: ICategory[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category._id, { ...category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category._id)!;
    const parentId = getCategoryParentId(category);

    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: CategoryTreeNode[]) => {
    items.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
}

export function flattenCategoryOptions(
  nodes: CategoryTreeNode[],
  depth = 0,
): FormSelectOption[] {
  const options: FormSelectOption[] = [];

  for (const node of nodes) {
    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    options.push({ id: node._id, label: `${prefix}${node.title}` });

    if (node.children.length) {
      options.push(...flattenCategoryOptions(node.children, depth + 1));
    }
  }

  return options;
}

export function getCategorySelectOptions(categories: ICategory[]): FormSelectOption[] {
  return flattenCategoryOptions(buildCategoryTree(categories));
}

export function collectDescendantIdSet(
  categories: ICategory[],
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId]);

  function walk(parentId: string) {
    for (const category of categories) {
      const parent = getCategoryParentId(category);
      if (parent === parentId && !ids.has(category._id)) {
        ids.add(category._id);
        walk(category._id);
      }
    }
  }

  walk(rootId);
  return ids;
}

export function getParentSelectOptions(
  categories: ICategory[],
  excludeId?: string,
): FormSelectOption[] {
  const filtered = excludeId
    ? categories.filter((category) => !collectDescendantIdSet(categories, excludeId).has(category._id))
    : categories;

  return [
    { id: "none", label: t("auto.k40c6063b26") },
    ...getCategorySelectOptions(filtered),
  ];
}

export function flattenCategoryTreeForList(
  nodes: CategoryTreeNode[],
  depth = 0,
): Array<{ category: ICategory; depth: number }> {
  const result: Array<{ category: ICategory; depth: number }> = [];

  for (const node of nodes) {
    result.push({ category: node, depth });
    if (node.children.length) {
      result.push(...flattenCategoryTreeForList(node.children, depth + 1));
    }
  }

  return result;
}
