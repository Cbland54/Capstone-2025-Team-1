import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react' 
import Scheduler from '../../components/Scheduler'

// prevent database calls from causing errors.
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

describe('Scheduler Component Mount', () => {
  // test case is only one simple assertion.
  it('1. Renders the main title header on initial load', async () => {
    render(<Scheduler />)
    
    // check for the most prominent, highest-level text.
    expect(screen.getByText(/Book Your Appointment/i)).toBeInTheDocument()
  })
});