
import { useEffect, useState } from "react";
import { searchTeachers, TeacherSearchParams } from "@/lib/api";

export function useTeacherSearch(params: TeacherSearchParams) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const res = await searchTeachers(params);
        if (!ignore) {
          setData(res.teachers || res.data || []);
          setTotal(res.total || 0);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to fetch teachers");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [JSON.stringify(params)]);

  return { data, total, loading, error };
}
