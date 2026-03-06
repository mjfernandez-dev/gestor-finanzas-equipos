import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NoGroups from './components/NoGroups'
import MemberDashboard from './components/MemberDashboard'
import AdminDashboard from './components/AdminDashboard'
import { Group } from '@/lib/types'

interface Props {
  searchParams: Promise<{ group?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { group: groupIdParam } = await searchParams

  // Buscar membresías del usuario
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) {
    return <NoGroups />
  }

  // Seleccionar el grupo activo: por param o el primero
  const membership = groupIdParam
    ? (memberships.find(m => m.groups?.id === groupIdParam) ?? memberships[0])
    : memberships[0]

  const group = membership.groups as Group
  const allGroups: Group[] = memberships.map(m => m.groups as Group)

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
        allGroups={allGroups}
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
      allGroups={allGroups}
      membership={membership}
      balance={balance}
      recentTransactions={recentTransactions ?? []}
    />
  )
}
