// Mock first
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// Spy mocks
const insert = vi.fn().mockResolvedValue({ error: null })
const customersSingle = vi.fn().mockResolvedValue({ data: { id: 42 }, error: null })
const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 777 }, error: null })

vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 33,
    staff_name: 'Taylor Pace',
    availability: JSON.stringify({
      Mon: '9-18', Tue: '9-18', Wed: '9-18', Thr: '9-18', Fri: '9-18', Sat: '9-18', Sun: '9-18',
    }),
    is_active: true,
    bio: 'Fast helper',
  }]
  return {
    supabase: {
      from: (table) => {
        if (table === 'staffschedules')
          return { select: () => ({ eq: async () => ({ data: staffData, error: null }) }) }
        if (table === 'customers')
          return { upsert: () => ({ select: () => ({ single: customersSingle }) }) }
        if (table === 'shoeselectorresponses')
          return { select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle }) }) }) }) }
        if (table === 'appointments')
          return { insert }
        return {}
      },
    },
  }
})

describe('Scheduler booking submission', () => {
  it('books an appointment end-to-end', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Wait for quick-book buttons
    const quickBtns = await waitFor(() =>
      screen.getAllByRole('button', { name: /with Taylor Pace/i })
    )
    await user.click(quickBtns[0])

    // Fill contact
    await user.type(await screen.findByLabelText(/First Name/i), 'Lee')
    await user.type(screen.getByLabelText(/Last Name/i), 'Jordan')
    await user.type(screen.getByLabelText(/Email/i), 'lee.jordan@example.com')
    await user.type(screen.getByLabelText(/Phone/i), '3055557777')

    // Next (contact step)
    await user.click(await screen.findByTestId('next-contact'))
    await screen.findByText(/Review Your Appointment/i)

    // Confirm
    await user.click(screen.getByRole('button', { name: /Confirm & Book/i }))
    await screen.findByText(/Appointment Confirmed!/i)

    await waitFor(() => expect(insert).toHaveBeenCalled())
    const [rows] = insert.mock.calls[0]
    const inserted = rows[0]
    expect(inserted.staff_schedule_id).toBe(33)
    expect(inserted.customer_id).toBe(42)
    expect(localStorage.getItem('fw_customer_id')).toBe('42')
  })
})