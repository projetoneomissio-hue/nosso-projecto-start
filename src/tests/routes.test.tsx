
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock Auth Context
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useAuth: () => mockUseAuth(),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (ui: React.ReactNode, { route = '/' } = {}) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <MemoryRouter initialEntries={[route]}>
                    {ui}
                </MemoryRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
};

describe('App Routes Smoke Tests', () => {

    it('should render Login page on /login', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        renderWithProviders(<AppRoutes />, { route: '/login' });
        expect(screen.getByText(/Sistema de Gestão/i)).toBeInTheDocument();
    });

    it('should render Planos page on /planos', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        renderWithProviders(<AppRoutes />, { route: '/planos' });
        expect(screen.getByText(/Novos Planos 2025/i)).toBeInTheDocument();
        expect(screen.getByText(/Starter/i)).toBeInTheDocument();
        expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
    });

    it('should render Checkout page on /checkout', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        renderWithProviders(<AppRoutes />, { route: '/checkout' });
        expect(screen.getByText(/Finalizar Assinatura/i)).toBeInTheDocument();
    });
});

