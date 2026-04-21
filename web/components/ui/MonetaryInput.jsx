'use client'

import { Controller } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

/**
 * Input de valor monetário (R$) integrado com React Hook Form.
 * @param {{
 *   name: string,
 *   control: any,
 *   label?: string,
 *   error?: string,
 *   placeholder?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function MonetaryInput({ name, control, label, error, placeholder = '0,00', disabled }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary select-none">
              R$
            </span>
            <NumericFormat
              id={name}
              {...field}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              disabled={disabled}
              placeholder={placeholder}
              onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
              className={[
                'w-full pl-9 rounded-lg border bg-bg-card px-3 py-2 text-sm text-text-primary',
                'placeholder:text-text-muted',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-text-muted',
                'transition-shadow duration-150',
                error
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[var(--color-border)]',
              ].join(' ')}
            />
          </div>
        )}
      />
      {error && (
        <p role="alert" className="text-xs text-[#EF4444] mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
