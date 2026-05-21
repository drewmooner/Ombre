import type { FormActionState } from "@/lib/form-action-state";
import { isRedirectErrorMessage } from "@/components/use-action-redirect";

type ActionAlertsProps = {
  state: FormActionState;
  className?: string;
};

export function ActionAlerts({ state, className = "" }: ActionAlertsProps) {
  const showError =
    state.error && !isRedirectErrorMessage(state.error) && !state.redirectTo;

  return (
    <>
      {showError && (
        <p className={`store-alert store-alert-error ${className}`.trim()}>
          {state.error}
        </p>
      )}
      {state.success && !state.redirectTo && (
        <p className={`store-alert store-alert-success ${className}`.trim()}>
          {state.success}
        </p>
      )}
    </>
  );
}
