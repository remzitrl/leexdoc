'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Music, Eye, EyeOff, Check } from 'lucide-react'

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
            // Success - redirect to library
            router.push('/library')
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-500/20 rounded-full blur-lg animate-pulse delay-500" />

      <Card className="w-full max-w-lg card-primary backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/logo.svg" alt="LeexDoc" className="w-12 h-12" />
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl font-bold gradient-text font-poppins">Create account</CardTitle>
            <CardDescription className="text-slate-600 text-lg mt-3">
              Join LeexDoc to start managing your documents
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
              <Label htmlFor="email" className="text-slate-700 font-semibold text-lg">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="input-primary h-14 text-lg rounded-xl"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="displayName" className="text-slate-700 font-semibold text-lg">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Enter your display name"
                value={formData.displayName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="input-primary h-14 text-lg rounded-xl"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-700 font-semibold text-lg">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="input-primary h-14 pr-12 text-lg rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-14 px-4 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl">
                  <div className={`flex items-center space-x-3 ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-medium">At least 8 characters</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-medium">One uppercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-medium">One lowercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-medium">One number</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-medium">One special character</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-lg">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="input-primary h-14 pr-12 text-lg rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-14 px-4 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 btn-primary text-xl font-semibold" 
              disabled={isLoading || !passwordValidation.isValid}
            >
              {isLoading ? 'Creating account and signing in...' : 'Create account'}
            </Button>
          </form>
          
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">Already have an account?</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="w-full h-14 btn-outline text-xl font-semibold"
                >
                  Sign in instead
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}