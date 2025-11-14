import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// Mock Supabase
vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 2,
    staff_name: 'Jamie Swift',
    availability: JSON.stringify({
      Mon: '9-18', Tue: '9-18', Wed: '9-18', Thr: '9-18', Fri: '9-18', Sat: '9-18', Sun: '9-18',
    }),
    is_active: true,
  }]
  return {
    supabase: {
      from: (table) => table === 'staffschedules'
        ? { select: () => ({ eq: async () => ({ data: staffData, error: null }) }) }
        : {},
    },
  }
})

describe('Scheduler validation and quick book flow', () => {
  it('validates services and date/time/associate', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Wait for associates to load (quick-book buttons appear)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /with Jamie Swift/i }).length).toBeGreaterThan(0)
    })

    // Enter full booking flow
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)       
    await screen.findByText(/Select Services/i)

    // Trigger service selection error
    await user.click(screen.getByTestId('next-services'))
    await screen.findByText(/Please select at least one service/i)

    // Select a service and move on
    const [serviceCb] = await screen.findAllByRole('checkbox')
    await user.click(serviceCb)
    await user.click(screen.getByTestId('next-services'))

    // Trigger date/time/associate validation error
    await user.click(screen.getByTestId('next-date-time'))
    await screen.findByText(/Please select a date, time, and associate/i)
  })

  it('quick-book then validates contact fields', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Ensure quick-book buttons are ready
    const quickButtons = await waitFor(() =>
      screen.getAllByRole('button', { name: /with Jamie Swift/i })
    )
    await user.click(quickButtons[0]) // jump to contact step

    await screen.findByLabelText(/First Name/i)

    // Empty contact fields
    await user.click(await screen.findByTestId('next-contact'))
    await screen.findByText(/Please fill out all contact fields before proceeding/i)

    // Invalid email
    await user.type(screen.getByLabelText(/First Name/i), 'Pat')
    await user.type(screen.getByLabelText(/Last Name/i), 'Case')
    await user.type(screen.getByLabelText(/Email/i), 'wrong-email')
    await user.type(screen.getByLabelText(/Phone/i), '3055551234')
    await user.click(screen.getByTestId('next-contact'))
    await screen.findByText(/valid email address/i)

    // Invalid phone
    const email = screen.getByLabelText(/Email/i)
    await user.clear(email)
    await user.type(email, 'pat@example.com')
    const phone = screen.getByLabelText(/Phone/i)
    await user.clear(phone)
    await user.type(phone, 'abc')
    await user.click(screen.getByTestId('next-contact'))
    await screen.findByText(/valid 10-digit phone number/i)

    // Fix phone and proceed
    await user.clear(phone)
    await user.type(phone, '3055559999')
    await user.click(screen.getByTestId('next-contact'))

    await waitFor(() =>
      expect(screen.getByText(/Review Your Appointment/i)).toBeInTheDocument()
    )
  })
})