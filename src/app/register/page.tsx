'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Check } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)
    const isLongEnough = password.length >= 8

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    }
  }

  const passwordValidation = validatePassword(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
      } else {
        // Auto-login after successful registration
        try {
          const loginResult = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          })

          if (loginResult?.error) {
            setError('Registration successful but login failed. Please sign in manually.')
            router.push('/login')
          } else {
            // Success - redirect to home
            router.push('/')
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
          setError('Registration successful but login failed. Please sign in manually.')
          router.push('/login')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <span className="text-6xl font-bold text-gray-900 block mb-6">LeexDoc</span>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-500">Join LeexDoc to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            />
          </div>
          
          <div>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Display name"
              value={formData.displayName}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Requirements - Simplified */}
          {formData.password && (
            <div className="space-y-2 text-xs text-gray-600">
              <div className={`flex items-center space-x-2 ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-gray-400'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                <span>One uppercase letter</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`} />
                <span>One lowercase letter</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`} />
                <span>One number</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-3 h-3 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`} />
                <span>One special character</span>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors" 
            disabled={isLoading || !passwordValidation.isValid}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        {/* Sign in link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gray-900 hover:text-gray-700 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}