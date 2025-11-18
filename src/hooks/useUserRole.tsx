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
