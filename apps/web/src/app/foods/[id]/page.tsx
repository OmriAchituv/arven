"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FoodForm } from "~/components/food-form";
import type { FoodDraft } from "~/components/food-form";
import { api } from "~/lib/trpc";

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const foodId = decodeURIComponent(params.id);

  const [food, setFood] = useState<FoodDraft | null>(null);
  const [logged, setLogged] = useState(0);

  useEffect(() => {
    Promise.all([api.nutrition.myFoods.query(), api.nutrition.foodUsage.query({ foodId })]).then(
      ([mine, usage]) => {
        const match = mine.find((candidate) => candidate.id === foodId);
        if (match) setFood({ ...match, units: match.units });
        setLogged(usage);
      },
    );
  }, [foodId]);

  if (!food) return null;

  return (
    <FoodForm
      initial={food}
      submitLabel="שמירה"
      onSubmit={async (draft) => {
        await api.nutrition.updateFood.mutate({ foodId, draft });
        router.push("/foods");
      }}
      onCancel={() => router.push("/foods")}
      footer={
        logged > 0 ? (
          // Entries point at the food rather than copying it, so a correction
          // reaches every day it appears on. Said plainly, because it is the
          // difference between fixing a typo and rewriting history.
          <p
            data-testid="edit-warning"
            style={{ marginTop: "1.75rem", color: "var(--ink-soft)", fontSize: "var(--step-1)" }}
          >
            המזון הזה נרשם {logged} פעמים. שינוי הערכים יעדכן גם את הימים הקודמים.
            אם מדובר במוצר אחר, עדיף ליצור מזון חדש.
          </p>
        ) : null
      }
    />
  );
}
