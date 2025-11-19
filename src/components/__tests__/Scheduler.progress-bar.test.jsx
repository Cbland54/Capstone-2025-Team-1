import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// prevent database calls from failing.
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

describe('Scheduler Progress Bar State', () => {
  // helper to reliably find the progress bar indicators.
  const getProgressIndicators = () => 
    screen.getAllByRole('generic', { hidden: true }).filter(
      (el) => el.className.includes('h-2 mx-1 rounded-full')
    )
    
  it('1. Only the first indicator is active (bg-primary) on initial load (Step 1)', () => {
    render(<Scheduler />)
    
    const indicators = getProgressIndicators()
    
    // first indicator should be marked with the active class.
    expect(indicators[0]).toHaveClass('bg-primary')
    
    // second indicator should be marked with the inactive class.
    expect(indicators[1]).toHaveClass('bg-gray-200')
  })

  it('2. The first two indicators are active after moving to Step 2', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // step 1 --> step 2
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn) 

    // the step change to complete (by checking for step 2 header).
    await screen.findByText(/Select Services/i)
    
    const indicators = getProgressIndicators()
    
    // step 1 and step 2 should now be marked active.
    expect(indicators[0]).toHaveClass('bg-primary')
    expect(indicators[1]).toHaveClass('bg-primary')
    
    // step 3 should remain inactive.
    expect(indicators[2]).toHaveClass('bg-gray-200')
  })
})