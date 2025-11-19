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
 * HOWEVER, this is NOT a security measure. All functions in this hook
 * check roles from client-side state, which can be manipulated.
 * 
 * ACTUAL SECURITY is enforced at the DATABASE level through:
 * 
 * 1. ROW LEVEL SECURITY (RLS) POLICIES
 *    - Every table has policies checking has_role(auth.uid(), 'role_name')
 *    - Policies prevent unauthorized data access regardless of client state
 *    - Example: "Professores podem ver matrículas de suas turmas"
 * 
 * 2. SECURITY DEFINER FUNCTIONS  
 *    - has_role(): Checks user_roles table with elevated privileges
 *    - is_coordenador_atividade(): Validates coordinator permissions
 *    - is_professor_turma(): Validates professor permissions
 *    - is_responsavel_aluno(): Validates parent/guardian permissions
 * 
 * 3. INVITE-BASED ADMIN REGISTRATION
 *    - Public signup restricted to 'responsavel' role only
 *    - Admin roles require valid invitation token
 *    - Tokens validated server-side before role assignment
 * 
 * USAGE EXAMPLE:
 * ```tsx
 * const { isDirecao, canManageAll } = useUserRole();
 * 
 * // ✅ CORRECT: Use for UI rendering
 * {isDirecao() && <AdminPanel />}
 * 
 * // ❌ WRONG: Never use for data access decisions
 * if (isDirecao()) {
 *   // Don't make security decisions here!
 *   // Use RLS-protected queries instead
 * }
 * ```
 * 
 * REMEMBER:
 * - Client-side checks = Better UX
 * - Server-side RLS = Actual security
 * - Never trust client-side role validation for security
 * 
 * See also:
 * - src/components/ProtectedRoute.tsx
 * - Database RLS policies
 * - has_role() and related security definer functions
 */

import { useAuth, UserRole } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return user?.role && roles.includes(user.role);
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
    isDirecao,
    isCoordenacao,
    isProfessor,
    isResponsavel,
    canManageAll,
    canManageActivities,
    canViewFinancial,
  };
};
