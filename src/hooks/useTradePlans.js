import { useEffect, useState } from "react";
import { getStoredPlans, savePlans } from "../domain/planManager";

export function useTradePlans() {
  const [plans, setPlans] = useState(() => getStoredPlans());

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  return [plans, setPlans];
}
