import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// Minimal mock
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

describe('Scheduler service state management', () => {
  it('toggles service selection correctly in the UI', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // navigate to Step 2.
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    await screen.findByText(/Select Services/i)

    // find the 'Running Shoe Fitting' checkbox.
    const serviceName = /Running Shoe Fitting/i
    const checkbox = screen.getByLabelText(serviceName)

    // 1. initial State Check (should be unchecked).
    expect(checkbox).not.toBeChecked()

    // 2. select the service.
    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    // 3. deselect the service.
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})