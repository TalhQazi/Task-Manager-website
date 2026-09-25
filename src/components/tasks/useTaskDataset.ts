import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTasksPage, TaskFilters, TaskView } from "@/lib/taskViews";

/* ------------------------------------------------------------------ *
 * The ONE shared task fetcher. Every view consumes this — switching a
 * view never re-creates or duplicates a record; at most it reuses the
 * same react-query cache key. Infinite pagination over the existing
 * /api/tasks endpoint powers virtual scrolling for 100k+ tasks.
 * ------------------------------------------------------------------ */
export function useTaskDataset(filters: TaskFilters) {
  const query = useInfiniteQuery({
    queryKey: ["task-dataset", filters],
    queryFn: ({ pageParam }) => fetchTasksPage(filters, pageParam as number, 100),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 10_000,
  });

  const tasks: TaskView[] = useMemo(
    () => (query.data?.pages || []).flatMap((p) => p.items),
    [query.data]
  );

  const total = query.data?.pages?.[0]?.total ?? tasks.length;

  return {
    tasks,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
