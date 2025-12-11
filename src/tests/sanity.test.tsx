import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Sanity Check', () => {
    it('should run basic math correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('should be able to render a basic div', () => {
        render(<div data-testid="test-div">Zafen</div>);
        expect(screen.getByTestId('test-div')).toBeInTheDocument();
    });
});
