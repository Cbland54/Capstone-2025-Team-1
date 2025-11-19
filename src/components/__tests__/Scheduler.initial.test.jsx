import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
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

describe('Scheduler initial rendering', () => {
  it('1. Renders the initial Step 1 welcome message on load', async () => {
    render(<Scheduler />)
    
    // check for the unique text of Step 1.
    expect(await screen.findByText(/Welcome, choose a quick appointment/i)).toBeInTheDocument()
    
    // ensure Step 2 elements are NOT present.
    expect(screen.queryByText(/Select Services/i)).not.toBeInTheDocument()
  })
  
  it('2. The "Book Appointment" button is visible in Step 1', async () => {
    render(<Scheduler />)
    
    // check for initial forward button.
    const [bookBtn] = await screen.findAllByRole('button', { name: /^Book Appointment$/i })
    expect(bookBtn).toBeInTheDocument()
    expect(bookBtn).toBeEnabled()
  })
})