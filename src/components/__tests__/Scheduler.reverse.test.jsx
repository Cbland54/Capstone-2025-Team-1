import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../Scheduler'

// Prevent console errors from useEffect/Supabase calls
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

describe('Scheduler Simple Reverse Navigation (Step 2 -> Step 1)', () => {
  it('correctly navigates back from the Services step to the Welcome step', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // 1. move from Step 1 (Welcome) to Step 2 (Services)
    // Use getAllByRole to ensure stability against StrictMode double render
    const [forwardBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(forwardBtn)

    // verify Step 2 is active
    expect(await screen.findByText(/Select Services/i)).toBeInTheDocument()

    // 2. click the "Back" button
    const backBtn = screen.getByRole('button', { name: /Back/i })
    await user.click(backBtn)

    // 3. verify return to Step 1 (Welcome)
    // Use the unique 'Book Appointment' button on Step 1 for a stable assertion
    expect(await screen.findByRole('button', { name: /^Book Appointment$/i })).toBeInTheDocument()
    
    // check that we left Step 2
    expect(screen.queryByText(/Select Services/i)).not.toBeInTheDocument()
  })
})