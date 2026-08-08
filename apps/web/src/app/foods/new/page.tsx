"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { FoodForm } from "~/components/food-form";
import type { FoodDraft } from "~/components/food-form";
import { api } from "~/lib/trpc";

function NewFood() {
  const router = useRouter();
  const params = useSearchParams();
  // Arriving from a search that found nothing, the name is already known.
  const name = params.get("name") ?? "";

  async function create(draft: FoodDraft) {
    await api.nutrition.createFood.mutate(draft);
    router.push(name ? `/add?q=${encodeURIComponent(draft.name)}` : "/foods");
  }

  return (
    <FoodForm
      initial={{ name }}
      submitLabel="שמירה"
      onSubmit={create}
      onCancel={() => router.back()}
    />
  );
}

export default function NewFoodPage() {
  return (
    <Suspense>
      <NewFood />
    </Suspense>
  );
}
