import { redirect } from "next/navigation";
import { getCurrentUser } from "./actions";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/shop");
  } else {
    redirect("/login");
  }
}
