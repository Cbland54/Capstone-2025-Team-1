import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// prevent console errors from useEffect/Supabase calls
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

describe('Scheduler navigation and state management', () => {
  it('navigates back from Step 2 (Services) to Step 1 (Welcome)', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // --- Step 1: Welcome/Quick Book ---
    // check for an element unique to Step 1,
    await screen.findByText(/Welcome, choose a quick appointment/i)

    // check "Book Appointment" button to go to Step 2.
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)

    // --- Step 2: Select Services ---
    // check for an element unique to Step 2.
    expect(await screen.findByText(/Select Services/i)).toBeInTheDocument()

    // click the "Back" button.
    const backBtn = screen.getByRole('button', { name: /Back/i })
    await user.click(backBtn)

    // --- Step 1: Returned to Welcome/Quick Book ---
    // the component should return to the initial step.
    expect(await screen.findByText(/Welcome, choose a quick appointment/i)).toBeInTheDocument()
  })
})