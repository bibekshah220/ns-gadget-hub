'use client'
import { useEffect } from 'react'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import Loading from '@/components/Loading'
import { useAppContext } from '@/context/AppContext'

const Layout = ({ children }) => {
  const { user, isSeller, router } = useAppContext()

  /* Redirect non-sellers away from the seller dashboard. */
  useEffect(() => {
    if (user && !isSeller) {
      router.replace('/')
    }
  }, [user, isSeller])

  if (!user || !isSeller) {
    return <Loading />
  }

  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        <Sidebar />
        {children}
      </div>
    </div>
  )
}

export default Layout