import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock before importing component
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}))

import Scheduler from '../../components/Scheduler'

describe('Scheduler', () => {
  it('renders booking header', () => {
    render(<Scheduler />)
    expect(screen.getByText(/Book Your Appointment/i)).toBeInTheDocument()
  })

  it('navigates to services step when clicking "Book Appointment"', async () => {
    render(<Scheduler />)
    const user = userEvent.setup()
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    expect(await screen.findByText(/Select Services/i)).toBeInTheDocument()
  })
})