'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Music, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/library')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gray-900" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,rgba(17,24,39,0.8),rgba(17,24,39,0))]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-500/20 rounded-full blur-lg animate-pulse delay-500" />

      <Card className="w-full max-w-lg bg-gray-800/95 backdrop-blur-md shadow-2xl border border-gray-700">
        <CardHeader className="text-center space-y-8 p-8">
          <div className="flex justify-center">
            <img src="/logo.svg" alt="LeexDoc" className="w-24 h-24" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold gradient-text font-poppins">Welcome back</CardTitle>
            <CardDescription className="text-gray-300 text-lg mt-3">
              Sign in to your LeexDoc account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="email" className="text-gray-200 font-semibold text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-14 text-lg rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-200 font-semibold text-lg">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-14 pr-12 text-lg rounded-xl border-2 border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-14 px-4 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Forgot your password?
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400 font-medium">Don't have an account?</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link href="/register">
                <Button 
                  variant="outline" 
                  className="w-full h-14 border-2 border-purple-400 text-purple-300 hover:bg-purple-900/20 hover:border-purple-300 text-xl font-semibold rounded-xl transition-all duration-200"
                >
                  Create new account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}