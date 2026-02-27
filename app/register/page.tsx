"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { UserRole } from "@/lib/types"

import Image from "next/image"

interface Institution {
  id: string
  name: string
  region: string
  country: string
}

export default function RegisterPage() {
  const { dispatch } = useAppStore()
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "" as string, institutionId: "" })
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/institutions')
      .then(res => res.json())
      .then(data => setInstitutions(data.institutions || []))
      .catch(() => setInstitutions([]))
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.email) errs.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email"
    if (!form.password) errs.password = "Password is required"
    else if (form.password.length < 6) errs.password = "Minimum 6 characters"
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match"
    if (!form.role) errs.role = "Select a role"
    if (!form.institutionId) errs.institutionId = "Select an institution"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          institutionId: form.institutionId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ email: data.error || 'Registration failed' })
        setLoading(false)
        return
      }

      // Success message and redirect to login
      alert('Registration successful! Please login.')
      router.push('/login')
    } catch (error) {
      setErrors({ email: 'Network error. Please try again.' })
      setLoading(false)
    }
  }

  const updateField = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined as unknown as string }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Image src="/logo.png" alt="Gradio" width={64} height={64} className="rounded-xl" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get started with Gradio</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-foreground">Role</Label>
            <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
              <SelectTrigger className={errors.role ? "border-destructive" : ""} aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candidate">Candidate</SelectItem>
                <SelectItem value="institution">Institution</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Institution</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={`w-full justify-between ${errors.institutionId ? "border-destructive" : ""}`}
                >
                  {form.institutionId
                    ? institutions.find((i) => i.id === form.institutionId)?.name
                    : "Select institution..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search institution..." />
                  <CommandEmpty>No institution found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {institutions.map((institution) => (
                      <CommandItem
                        key={institution.id}
                        value={institution.name}
                        onSelect={() => {
                          updateField("institutionId", institution.id)
                          setOpen(false)
                        }}
                      >
                        {institution.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.institutionId && <p className="text-xs text-destructive">{errors.institutionId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-sm font-medium text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              className={errors.confirmPassword ? "border-destructive" : ""}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
