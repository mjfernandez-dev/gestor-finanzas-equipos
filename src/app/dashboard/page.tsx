import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NoGroups from './components/NoGroups'
import MemberDashboard from './components/MemberDashboard'
import AdminDashboard from './components/AdminDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar membresías del usuario
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) {
    return <NoGroups />
  }

  // Por ahora tomamos el primer grupo (multi-grupo viene después)
  const membership = memberships[0]
  const group = membership.groups

  // Calcular saldo del miembro
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('member_id', membership.id)
    .eq('status', 'approved')

  const balance = (transactions ?? []).reduce((acc, t) => {
    return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)

  // Últimas 10 transacciones
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('member_id', membership.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (membership.role === 'admin') {
    // Para admin: traer todos los miembros con sus saldos
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)

    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('group_id', group.id)
      .eq('status', 'approved')

    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('group_id', group.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const membersWithBalance = (allMembers ?? []).map(m => {
      const memberTxs = (allTransactions ?? []).filter(t => t.member_id === m.id)
      const bal = memberTxs.reduce((acc, t) => {
        return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
      }, 0)
      return { ...m, balance: bal }
    })

    return (
      <AdminDashboard
        group={group}
        membership={membership}
        membersWithBalance={membersWithBalance}
        pendingTransactions={pendingTransactions ?? []}
        recentTransactions={recentTransactions ?? []}
        balance={balance}
      />
    )
  }

  return (
    <MemberDashboard
      group={group}
      membership={membership}
      balance={balance}
      recentTransactions={recentTransactions ?? []}
    />
  )
}
