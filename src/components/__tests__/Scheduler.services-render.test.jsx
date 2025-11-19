import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// comprehensive mock to ensure services data is available.
vi.mock('../../components/supabaseClient', () => {
  const serviceData = [{
    id: 1,
    service_name: 'Consultation - 15 min',
    service_price: 0,
  }]
  return {
    supabase: {
      from: (table) => {
        if (table === 'services')
          return { select: () => ({ eq: async () => ({ data: serviceData, error: null }) }) }
        return { select: () => ({ eq: async () => ({ data: [], error: null }) }) }
      },
    },
  }
})

describe('Scheduler Service Rendering', () => {
  it('1. Displays the Services step header after navigation', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // step 1 --> step 2
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn) 

    // verify step header.
    expect(await screen.findByText(/Select Services/i)).toBeInTheDocument()
  })

})