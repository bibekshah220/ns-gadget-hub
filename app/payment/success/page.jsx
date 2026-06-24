'use client'
import { useAppContext } from '@/context/AppContext'
import { useEffect } from 'react'

const PaymentSuccess = () => {

  const { router } = useAppContext()

  useEffect(() => {
    setTimeout(() => {
      router.push('/my-orders')
    }, 3000)
  }, [])

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl">
          ✓
        </div>
      </div>
      <div className="text-center text-2xl font-semibold text-green-600">Payment Successful!</div>
      <p className="text-gray-500">Redirecting to your orders...</p>
    </div>
  )
}

export default PaymentSuccess
