import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extende os matchers do Vitest com os do jest-dom
// @ts-ignore
expect.extend(matchers);

// Limpa o DOM após cada teste
afterEach(() => {
    cleanup();
});
