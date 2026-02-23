/**
 * SECURITY DOCUMENTATION: User Role Hook
 * ========================================
 * 
 * ⚠️ CRITICAL: THIS HOOK IS FOR UX ONLY, NOT SECURITY
 * 
 * This hook provides convenient client-side role checking for:
 * - Showing/hiding UI elements based on user role
 * - Conditional rendering of features
 * - Navigation menu customization
 * - Client-side route protection
 * 
 * MULTI-ROLE SUPPORT:
 * - Users can have multiple roles (e.g., coordenacao + responsavel)
 * - `hasRole()` checks against the ACTIVE role (for UI layout)
 * - `hasAnyAssignedRole()` checks against ALL assigned roles (for route access)
 * - `activeRole` is the currently selected role
 * - `setActiveRole()` switches the active profile
 * 
 * ACTUAL SECURITY is enforced at the DATABASE level through RLS policies.
 * 
 * See also:
 * - src/components/ProtectedRoute.tsx
 * - Database RLS policies
 * - has_role() and related security definer functions
 */

import { useAuth, UserRole } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user, isAuthenticated, setActiveRole } = useAuth();

  /** Checks if the ACTIVE role matches */
  const hasRole = (role: UserRole) => {
    return user?.activeRole === role;
  };

  /** Checks if the ACTIVE role is in the list */
  const hasAnyRole = (roles: UserRole[]) => {
    return user?.activeRole && roles.includes(user.activeRole);
  };

  /** Checks if the user has ANY of these roles assigned (not just active) */
  const hasAnyAssignedRole = (roles: UserRole[]) => {
    return user?.roles?.some(r => roles.includes(r)) ?? false;
  };

  const isDirecao = () => hasRole("direcao");
  const isCoordenacao = () => hasRole("coordenacao");
  const isProfessor = () => hasRole("professor");
  const isResponsavel = () => hasRole("responsavel");

  const canManageAll = () => isDirecao();
  const canManageActivities = () => isDirecao() || isCoordenacao();
  const canViewFinancial = () => isDirecao() || isCoordenacao();

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAnyAssignedRole,
    isDirecao,
    isCoordenacao,
    isProfessor,
    isResponsavel,
    canManageAll,
    canManageActivities,
    canViewFinancial,
    roles: user?.roles || [],
    activeRole: user?.activeRole,
    setActiveRole,
    hasMultipleRoles: (user?.roles?.length ?? 0) > 1,
  };
};
