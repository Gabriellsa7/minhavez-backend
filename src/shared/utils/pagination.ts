export interface IPaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface IPaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

export function parsePagination(
  query: IPaginationQuery,
): IPaginationParams | null {
  if (query.page === undefined && query.limit === undefined) {
    return null;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number(query.limit) || DEFAULT_LIMIT),
  );

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  pagination: IPaginationParams | null,
): IPaginatedResult<T> {
  if (!pagination) {
    return {
      data: items,
      page: 1,
      limit: totalItems,
      totalItems,
      totalPages: 1,
    };
  }

  return {
    data: items,
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pagination.limit)),
  };
}
