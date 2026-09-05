import { useEffect, useState } from "react";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";

interface EmpLike {
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatarDataUrl?: string;
}

/**
 * Loads the employee directory once and returns a resolver that maps an
 * employee's name or email to their (proxied) profile picture URL.
 *
 * Usage:
 *   const getAvatar = useEmployeeAvatars();
 *   <AvatarImage src={getAvatar(employeeName)} />
 *
 * Returns undefined when the person has no uploaded avatar (fall back to initials).
 */
export function useEmployeeAvatars() {
  const [byName, setByName] = useState<Map<string, string>>(new Map());
  const [byEmail, setByEmail] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch<{ items: EmpLike[] }>("/api/employees");
        if (!mounted) return;
        const nameMap = new Map<string, string>();
        const emailMap = new Map<string, string>();
        (res.items || []).forEach((e) => {
          const avatar = String(e.avatarDataUrl || e.avatarUrl || "").trim();
          if (!avatar) return;
          if (e.name) nameMap.set(e.name.toLowerCase().trim(), avatar);
          if (e.email) emailMap.set(e.email.toLowerCase().trim(), avatar);
        });
        setByName(nameMap);
        setByEmail(emailMap);
      } catch {
        /* directory unavailable — resolver just returns undefined */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (key?: string): string | undefined => {
    if (!key) return undefined;
    const k = key.toLowerCase().trim();
    const raw = byName.get(k) || byEmail.get(k);
    return raw ? toProxiedUrl(raw) || raw : undefined;
  };
}
