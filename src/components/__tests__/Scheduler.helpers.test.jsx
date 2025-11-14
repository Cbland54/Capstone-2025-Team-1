import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

// Mock Supabase: associate available every day to avoid date dependence
vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 1,
    staff_name: 'Alex Runner',
    availability: JSON.stringify({
      Mon: '9-5',
      Tue: '9-5',
      Wed: '9-5',
      Thr: '9-5',
      Fri: '9-5',
      Sat: '9-5',
      Sun: '9-5',
    }),
    is_active: true,
    bio: 'Bio text',
  }]
  return {
    supabase: {
      from: (table) =>
        table === 'staffschedules'
          ? { select: () => ({ eq: async () => ({ data: staffData, error: null }) }) }
          : {},
    },
  }
})

describe('Scheduler helper behaviors', () => {
  it('shows available associate', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    // Step 1 -> Step 2
    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    await screen.findByText(/Select Services/i)

    // Pick first service
    const [firstService] = await screen.findAllByRole('checkbox')
    await user.click(firstService)

    // Next to step 3
    await user.click(screen.getAllByRole('button', { name: /^Next$/i })[0])

    // Wait for associate select and its options
    const select = await screen.findByRole('combobox')
    await waitFor(() => {
      const options = within(select).getAllByRole('option')
      expect(options.some(o => /Alex Runner/.test(o.textContent || ''))).toBe(true)
    })
  })

  it('generates time slots and formats them', async () => {
    const user = userEvent.setup()
    render(<Scheduler />)

    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    await screen.findByText(/Select Services/i)

    const [firstService] = await screen.findAllByRole('checkbox')
    await user.click(firstService)
    await user.click(screen.getAllByRole('button', { name: /^Next$/i })[0])

    const select = await screen.findByRole('combobox')
    const allOptions = within(select).getAllByRole('option')
    // Second option is the associate (first is placeholder)
    await user.selectOptions(select, allOptions[1])

    // Wait for a specific time button to appear
    await screen.findByRole('button', { name: /9:00 AM/i })
    screen.getByRole('button', { name: /5:00 PM/i })
  })
})