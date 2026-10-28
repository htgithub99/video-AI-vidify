import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { FEATURE_WORKSPACE as C } from "../../constants/featureWorkspace.js";
import type { Lang } from "../../lib/lang.js";
import { appError } from "../../lib/logger.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import { PageLoadingSpinner } from "../ui/Skeleton.js";
import { StudioCard } from "../ui/Studio.js";
type BoundaryProps = { children: ReactNode; feature: string; active: boolean; language: Lang };
export class FeatureErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    appError(C.ERROR_EVENT, error, { feature: this.props.feature, componentStack: info.componentStack });
  }
  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.failed && this.props.active && !previous.active) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const t = C.UI[this.props.language] || C.UI.vi;
    return (
      <div className={C.RECOVERY}>
        <StudioCard className={C.RECOVERY_CARD}>
          <h2 className={C.RECOVERY_TITLE}>{t.TITLE}</h2>
          <p className={C.RECOVERY_COPY}>{t.DESCRIPTION}</p>
          <Button onClick={() => this.setState({ failed: false })}>{t.RETRY}</Button>
        </StudioCard>
      </div>
    );
  }
}
export const FeatureWorkspace = ({ active, keepMounted = false, feature, language, children }: { active: boolean; keepMounted?: boolean; feature: string; language: Lang; children: ReactNode }) => {
  const [visited, setVisited] = useState(active);
  useEffect(() => {
    if (active && !visited) setVisited(true);
  }, [active, visited]);
  if (!active && (!keepMounted || !visited)) return null;
  return (
    <div className={cn(C.CONTAINER, !active && C.HIDDEN)} aria-hidden={!active}>
      <FeatureErrorBoundary feature={feature} active={active} language={language}>
        <Suspense fallback={<PageLoadingSpinner className={C.CONTAINER} />}>{children}</Suspense>
      </FeatureErrorBoundary>
    </div>
  );
};
