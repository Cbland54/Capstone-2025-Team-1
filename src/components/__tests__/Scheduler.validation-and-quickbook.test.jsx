// Mock first
import { vi, describe, it, expect } from 'vitest'

vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 2,
    staff_name: 'Jamie Swift',
    availability: JSON.stringify({
      Mon: '9-12', Tue: '9-12', Wed: '9-12', Thr: '9-12', Fri: '9-12', Sat: '9-12', Sun: '9-12',
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

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

describe('Scheduler validation and quick book flow', () => {
  it('validates services and date/time/associate', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Wait for quick-book buttons (Jamie Swift)
    await screen.findAllByRole('button', { name: /with Jamie Swift/i })

    // Enter full booking flow (step 2)
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    await screen.findByText(/Select Services/i)

    // Trigger service selection error (step 2 next)
    await user.click(screen.getByTestId('next-services'))
    await screen.findByText(/Please select at least one service/i)

    // Select one service then advance
    const [serviceCb] = await screen.findAllByRole('checkbox')
    await user.click(serviceCb)
    await user.click(screen.getByTestId('next-services'))

    // Now on step 3 (date/time/associate) – trigger its validation error
    await user.click(screen.getByTestId('next-date-time'))
    await screen.findByText(/Please select a date, time, and associate/i)
  })

  it('quick-book then validates contact fields', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Quick-book buttons appear (step 1)
    const quickButtons = await screen.findAllByRole('button', { name: /with Jamie Swift/i })
    await user.click(quickButtons[0]) // jumps to contact step (step 4)

    await screen.findByLabelText(/First Name/i)

    // Empty contact fields error
    await (await screen.findByTestId('next-contact')).click()
    await screen.findByText(/Please fill out all contact fields before proceeding/i)

    // Invalid email
    await user.type(screen.getByLabelText(/First Name/i), 'Pat')
    await user.type(screen.getByLabelText(/Last Name/i), 'Case')
    await user.type(screen.getByLabelText(/Email/i), 'wrong-email')
    await user.type(screen.getByLabelText(/Phone/i), '3055551234')
    await screen.getByTestId('next-contact').click()
    await screen.findByText(/valid email address/i)

    // Invalid phone
    const email = screen.getByLabelText(/Email/i)
    await user.clear(email)
    await user.type(email, 'pat@example.com')
    const phone = screen.getByLabelText(/Phone/i)
    await user.clear(phone)
    await user.type(phone, 'abc')
    await screen.getByTestId('next-contact').click()
    await screen.findByText(/valid 10-digit phone number/i)

    // Fix phone and proceed to review step
    await user.clear(phone)
    await user.type(phone, '3055559999')
    await screen.getByTestId('next-contact').click()

    await waitFor(() =>
      expect(screen.getByText(/Review Your Appointment/i)).toBeInTheDocument()
    )
  })
})