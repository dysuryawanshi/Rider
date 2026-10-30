import { router } from "expo-router";
import { EmptyState } from "@/components/StateViews";

export default function NotFound() {
  return (
    <EmptyState
      icon="map-marker-question-outline"
      title="This page doesn't exist"
      body="The link may be out of date."
      actionLabel="Go to orders"
      onAction={() => router.replace("/")}
    />
  );
}
