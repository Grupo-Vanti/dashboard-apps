/*
To Do:
1. How to handle error in handler? We have setApiError(error), but how to use this on front end?
*/

import {
  Button,
  HookedForm,
  HookedInputRadioGroup,
  HookedValidationApiError,
  PageLayout,
  ResourceAddress,
  Spacer,
  useCoreSdkProvider,
  useOverlay,
  withSkeletonTemplate
} from '@commercelayer/app-elements'
import type { Order } from '@commercelayer/sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  order: Order
  close: () => void
  onChange?: () => void
}
interface PropsAddresses {
  order: Order
  close: () => void
  onChange?: () => void
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useCustomerAddressOverlay(
  order: Props['order'],
  onChange?: Props['onChange']
) {
  const { Overlay, open, close } = useOverlay()

  return {
    close,
    open,
    Overlay: () => (
      <Overlay>
        <PageLayout
          title='Select address'
          navigationButton={{
            onClick: () => {
              close()
            },
            label: 'Cancel',
            icon: 'x'
          }}
        >
          <CustomerAddresses order={order} close={close} onChange={onChange} />
        </PageLayout>
      </Overlay>
    )
  }
}

const CustomerAddresses = withSkeletonTemplate<PropsAddresses>(
  ({ order, close, onChange }): JSX.Element | null => {
    const { sdkClient } = useCoreSdkProvider()
    const [apiError, setApiError] = useState<any>()

    const methods = useForm<{ addressId: string; useForBilling: boolean }>({
      resolver: zodResolver(
        z.object({ addressId: z.string(), useForBilling: z.boolean() })
      )
    })

    return (
      <HookedForm
        {...methods}
        onSubmit={async (formValues) => {
          await sdkClient.orders
            .update({
              id: order.id,
              [formValues.useForBilling
                ? 'billing_address'
                : 'shipping_address']: sdkClient.addresses.relationship(
                formValues.addressId
              )
            })
            .then(() => {
              onChange?.()
              close()
            })
            .catch((error) => {
              setApiError(error)
            })
        }}
      >
        <HookedInputRadioGroup
          name='addressId'
          showInput={false}
          options={
            order.customer?.customer_addresses?.map((address) => ({
              content: <ResourceAddress address={address.address} />,
              value: address?.address?.id ?? ''
            })) ?? []
          }
        />
        <Spacer top='10'>
          <div className='flex flex-row gap-6 md:gap-8'>
            <Button
              variant='secondary'
              fullWidth
              onClick={() => {
                methods.setValue('useForBilling', true)
              }}
            >
              Use for billing
            </Button>
            <Button
              variant='secondary'
              fullWidth
              onClick={() => {
                methods.setValue('useForBilling', false)
              }}
            >
              Use for shipping
            </Button>
          </div>
        </Spacer>
        <Spacer top='2'>
          <HookedValidationApiError apiError={apiError} />
        </Spacer>
      </HookedForm>
    )
  }
)
