import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
  type WhereFilterOp,
} from "firebase/firestore";
import { db } from "../firebase";

export function useCollection<T>(
  path: string,
  orderByField?: string,
  direction: "asc" | "desc" = "asc",
  filter?: [string, WhereFilterOp, unknown],
  enabled = true,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const filterField = filter?.[0];
  const filterOp = filter?.[1];
  const filterValue = filter?.[2];

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const constraints: QueryConstraint[] = [];
    if (filterField && filterOp && filterValue !== undefined) {
      constraints.push(where(filterField, filterOp, filterValue));
    }
    if (orderByField) {
      constraints.push(orderBy(orderByField, direction));
    }
    const q = query(collection(db, path), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, orderByField, direction, filterField, filterOp, filterValue, enabled]);

  return { data, loading };
}
