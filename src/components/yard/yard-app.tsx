import { useEffect } from "react";
import { Gate } from "@/components/yard/gate";
import { Shell } from "@/components/yard/shell";
import { useYard } from "@/lib/yard/store";

export function YardApp() {
  const signedIn = useYard((state) => state.signedIn);
  const hydrate = useYard((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!signedIn) return <Gate />;
  return <Shell />;
}
