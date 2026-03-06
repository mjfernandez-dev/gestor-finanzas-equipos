import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinGroupButton from './JoinGroupButton'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/invite/${token}`)
  }

  // Buscar el grupo por token usando función SECURITY DEFINER (omite RLS para esta consulta puntual)
  const { data: groups } = await supabase
    .rpc('get_group_by_invite_token', { p_token: token })

  const group = groups?.[0] ?? null

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white text-lg font-bold">Link inválido</p>
          <p className="text-gray-400 text-sm mt-1">Este link de invitación no existe o expiró.</p>
        </div>
      </div>
    )
  }

  // Verificar si ya es miembro
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6 text-center">
        <div>
          <p className="text-gray-400 text-sm">Te invitaron a unirte a</p>
          <h1 className="text-2xl font-bold text-white mt-1">{group.name}</h1>
        </div>

        <JoinGroupButton
          groupId={group.id}
          userId={user.id}
          userName={user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email ?? 'Jugador'}
          userEmail={user.email ?? ''}
          userAvatar={user.user_metadata?.avatar_url ?? null}
        />
      </div>
    </div>
  )
}
