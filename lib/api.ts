import prisma from "@/lib/prisma"

export type ApiUser = {
  id: string
  email: string
  name: string
}

export async function getApiUser(email?: string | null): Promise<ApiUser> {
  const demoEmail = email && email.trim().length ? email : "demo@foboh.local"

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: "demo",
      name: demoEmail === "demo@foboh.local" ? "Demo User" : demoEmail,
    },
    select: { id: true, email: true, name: true },
  })

  return user
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status })
}


