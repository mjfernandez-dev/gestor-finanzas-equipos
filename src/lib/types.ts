export type Role = 'admin' | 'member'
export type TransactionType = 'debit' | 'credit'
export type TransactionStatus = 'pending' | 'approved' | 'rejected'
export type PaymentMethod = 'transfer' | 'cash'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  payment_alias: string | null
  invite_token: string
  created_by: string | null
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string | null
  display_name: string
  role: Role
  is_virtual: boolean
  created_at: string
}

export interface Transaction {
  id: string
  group_id: string
  member_id: string
  type: TransactionType
  amount: number
  description: string | null
  status: TransactionStatus
  payment_method: PaymentMethod | null
  created_by: string | null
  created_at: string
}

export interface GroupMemberWithBalance extends GroupMember {
  balance: number
}
