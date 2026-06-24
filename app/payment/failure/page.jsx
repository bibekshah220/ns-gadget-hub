'use client'
import { useAppContext } from '@/context/AppContext'

const PaymentFailure = () => {

  const { router } = useAppContext()

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <div className="h-24 w-24 bg-red-500 rounded-full flex items-center justify-center text-white text-5xl">
          ✕
        </div>
      </div>
      <div className="text-center text-2xl font-semibold text-red-600">Payment Failed</div>
      <p className="text-gray-500">Something went wrong with your transaction.</p>
      <button onClick={() => router.push('/cart')} className="mt-4 px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
        Return to Cart
      </button>
    </div>
  )
}

export default PaymentFailure
