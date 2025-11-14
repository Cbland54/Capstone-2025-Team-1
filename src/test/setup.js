import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock emailjs to avoid network calls during tests
vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue({ status: 200 }) },
}));

// Stub EmailJS globals used by Scheduler.handleSubmit
vi.stubGlobal('EMAILJS_SERVICE_ID', 'test_service');
vi.stubGlobal('EMAILJS_TEMPLATE_ID', 'test_template');
vi.stubGlobal('EMAILJS_PUBLIC_KEY', 'test_public_key');

// Mock react-calendar without JSX or React
vi.mock('react-calendar', () => ({
  default: function CalendarMock() {
    return null;
  },
}));