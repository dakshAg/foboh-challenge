export default function Page() {
  const { redirect } = require("next/navigation") as typeof import("next/navigation")
  redirect("/dashboard")
}