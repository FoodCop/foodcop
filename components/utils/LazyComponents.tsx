import { lazy, Suspense } from "react";
import { AsyncErrorBoundary } from "../ui/AsyncErrorBoundary";
import { ErrorBoundary } from "../ui/ErrorBoundary";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 bg-[#F14C35] rounded-full animate-pulse"></div>
  </div>
);

// Loading fallback for lazy components
const LazyFallback = ({ componentName }: { componentName: string }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center animate-pulse">
      <span className="text-white text-xl">🐙</span>
    </div>
    <p className="text-gray-600 text-sm">Loading {componentName}...</p>
  </div>
);

// Lazy load heavy components
export const LazyChatPage = lazy(() =>
  import("./ChatPage").then((module) => ({ default: module.ChatPage }))
);
export const LazyRecipesPage = lazy(() =>
  import("./Bites").then((module) => ({ default: module.RecipesPage }))
);
export const LazyScoutPage = lazy(() =>
  import("./ScoutPage").then((module) => ({ default: module.ScoutPage }))
);
export const LazySnapPage = lazy(() =>
  import("./SnapPage").then((module) => ({ default: module.SnapPage }))
);
export const LazyPlatePage = lazy(() =>
  import("./PlatePage").then((module) => ({ default: module.PlatePage }))
);
export const LazyGroupDiningPage = lazy(() =>
  import("../features/GroupDiningPage").then((module) => ({
    default: module.GroupDiningPage,
  }))
);
export const LazyMasterBotsShowcase = lazy(() =>
  import("./MasterBotsShowcase").then((module) => ({
    default: module.MasterBotsShowcase,
  }))
);
export const LazyMasterBotDashboard = lazy(() =>
  import("./MasterBotDashboard").then((module) => ({
    default: module.MasterBotDashboard,
  }))
);

// Wrapper component for lazy loading with error boundaries
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

export const LazyWrapper = ({
  children,
  fallback,
  componentName = "component",
}: LazyWrapperProps) => (
  <ErrorBoundary>
    <AsyncErrorBoundary>
      <Suspense
        fallback={fallback || <LazyFallback componentName={componentName} />}
      >
        {children}
      </Suspense>
    </AsyncErrorBoundary>
  </ErrorBoundary>
);

// Pre-configured lazy components with error boundaries
export const ChatPageLazy = (props: any) => (
  <LazyWrapper componentName="Chat">
    <LazyChatPage {...props} />
  </LazyWrapper>
);

export const RecipesPageLazy = (props: any) => (
  <LazyWrapper componentName="Recipes">
    <LazyRecipesPage {...props} />
  </LazyWrapper>
);

export const ScoutPageLazy = (props: any) => (
  <LazyWrapper componentName="Scout">
    <LazyScoutPage {...props} />
  </LazyWrapper>
);

export const SnapPageLazy = (props: any) => (
  <LazyWrapper componentName="Snap">
    <LazySnapPage {...props} />
  </LazyWrapper>
);

export const PlatePageLazy = (props: any) => (
  <LazyWrapper componentName="Plate">
    <LazyPlatePage {...props} />
  </LazyWrapper>
);

export const GroupDiningPageLazy = (props: any) => (
  <LazyWrapper componentName="Group Dining">
    <LazyGroupDiningPage {...props} />
  </LazyWrapper>
);

export const MasterBotsShowcaseLazy = (props: any) => (
  <LazyWrapper componentName="Master Bots">
    <LazyMasterBotsShowcase {...props} />
  </LazyWrapper>
);

export const MasterBotDashboardLazy = (props: any) => (
  <LazyWrapper componentName="Bot Dashboard">
    <LazyMasterBotDashboard {...props} />
  </LazyWrapper>
);
