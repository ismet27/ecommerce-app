import type { Role } from '../api/types'

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'seller':
      return '/seller'
    case 'customer':
      return '/'
  }
}
