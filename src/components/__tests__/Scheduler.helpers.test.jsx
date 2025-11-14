import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Scheduler from '../../components/Scheduler'

vi.mock('../../components/supabaseClient', () => {
  const staffData = [{
    id: 1,
    staff_name: 'Alex Runner',
    availability: JSON.stringify({
      Mon: '9-18', Tue: '9-18', Wed: '9-18', Thr: '9-18',
      Fri: '9-18', Sat: '9-18', Sun: '9-18',
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

    const [bookBtn] = screen.getAllByRole('button', { name: /^Book Appointment$/i })
    await user.click(bookBtn)
    await screen.findByText(/Select Services/i)

    const [firstService] = await screen.findAllByRole('checkbox')
    await user.click(firstService)
    await user.click(screen.getByTestId('next-services'))

    // Use label-based query (avoids multiple combobox issue)
    const select = await screen.findByLabelText(/Select Associate/i)

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
    await user.click(screen.getByTestId('next-services'))

    // Prefer label text to avoid duplicate combobox render (StrictMode double render)
    const select = await screen.findByLabelText(/Select Associate/i)

    // Alternatively, if duplicates persist:
    // const select = (await screen.findAllByRole('combobox'))
    //   .find(el => el.getAttribute('id') === 'associate-select')

    const options = within(select).getAllByRole('option')
    // Select associate (2nd option; first is placeholder)
    await user.selectOptions(select, options[1])

    await screen.findByRole('button', { name: /10:00 AM/i })
    screen.getByRole('button', { name: /6:00 PM/i })
  })
})