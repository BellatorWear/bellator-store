import { redirect } from "next/navigation";
import { getCurrentUser } from "./actions";
import MethodSelectClient from "./MethodSelectClient";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/shop");
  }
  return <MethodSelectClient />;
}
