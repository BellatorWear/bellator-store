import { Suspense } from "react";
import MethodSelectClient from "@/app/MethodSelectClient";

export const metadata = { title: "Anmelden — Bellator Streetwear" };

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <MethodSelectClient />
    </Suspense>
  );
}
