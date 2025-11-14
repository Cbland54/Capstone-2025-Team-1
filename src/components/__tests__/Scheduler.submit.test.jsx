// Mock first
import { describe, it, expect, vi } from 'vitest'

// Define spies in outer scope so we can assert them directly.
const insert = vi.fn().mockResolvedValue({ error: null })
const customersSingle = vi.fn().mockResolvedValue({ data: { id: 42 }, error: null })
const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 777 }, error: null })

// Mock before component import.
vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 33,
    staff_name: 'Taylor Pace',
    availability: JSON.stringify({ Fri: '9-12' }),
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

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

describe('Scheduler booking submission', () => {
  it('books an appointment end-to-end', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Quick book button(s)
    const quickBtns = await screen.findAllByRole('button', { name: /with Taylor Pace/i })
    await user.click(quickBtns[0])

    // Contact form fields
    const firstName = await screen.findByLabelText(/First Name/i)
    await user.type(firstName, 'Lee')
    await user.type(screen.getByLabelText(/Last Name/i), 'Jordan')
    await user.type(screen.getByLabelText(/Email/i), 'lee.jordan@example.com')
    await user.type(screen.getByLabelText(/Phone/i), '3055557777')

    // Proceed to review
    await user.click(screen.getByRole('button', { name: /^Next$/i }))
    await screen.findByText(/Review Your Appointment/i)

    // Confirm booking
    await user.click(screen.getByRole('button', { name: /Confirm & Book/i }))
    await screen.findByText(/Appointment Confirmed!/i)

    // Assert insert called
    await waitFor(() => expect(insert).toHaveBeenCalled())
    const [rows] = insert.mock.calls[0]
    const inserted = rows[0]
    expect(inserted.staff_schedule_id).toBe(33)
    expect(inserted.customer_id).toBe(42)
    expect(localStorage.getItem('fw_customer_id')).toBe('42')
  })
})