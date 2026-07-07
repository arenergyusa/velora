'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, RefreshCw } from 'lucide-react'

export default function AdminConfigPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    min_withdrawal_usd: '10',
    withdrawal_fee_percent: '10',
    platform_wallet_address: '',
    salary_amount_usd: '100',
    salary_min_downline_business: '5000',
    salary_monthly_increment_percent: '25'
  })

  const fetchConfig = () => {
    fetch('/api/admin/config')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error()
        return data
      })
      .then(data => {
        if (data.data) {
          setConfig(prev => ({ ...prev, ...data.data }))
        }
      })
      .catch(() => {
        setLoadError(true)
        toast.error('Failed to load configuration')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const isValid = () => {
    const minW = Number(config.min_withdrawal_usd)
    const fee = Number(config.withdrawal_fee_percent)
    const salAmt = Number(config.salary_amount_usd)
    const salBiz = Number(config.salary_min_downline_business)
    const salInc = Number(config.salary_monthly_increment_percent)
    const wallet = config.platform_wallet_address.trim()

    if (isNaN(minW) || minW < 0) return false
    if (isNaN(fee) || fee < 0 || fee > 100) return false
    if (isNaN(salAmt) || salAmt < 0) return false
    if (isNaN(salBiz) || salBiz < 0) return false
    if (isNaN(salInc) || salInc < 0 || salInc > 100) return false
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return false

    return true
  }

  const handleSave = async () => {
    if (!isValid()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Configuration updated successfully')
      } else {
        toast.error(data.error || 'Failed to update configuration')
      }
    } catch {
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage global settings, fees, and network constraints.</p>
      </div>

      {loadError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">Failed to Load Configuration</h2>
            <p className="text-muted-foreground">We couldn&apos;t retrieve the live settings. Saving is disabled to prevent overwriting.</p>
            <Button variant="outline" onClick={() => {
              setLoading(true)
              setLoadError(false)
              fetchConfig()
            }}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!loadError && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>Withdrawal and capping constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Withdrawal (USD)</Label>
                <Input type="number" min="0" name="min_withdrawal_usd" value={config.min_withdrawal_usd} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Withdrawal Fee (%)</Label>
                <Input type="number" min="0" max="100" name="withdrawal_fee_percent" value={config.withdrawal_fee_percent} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Platform Master Wallet</Label>
                <Input type="text" name="platform_wallet_address" value={config.platform_wallet_address} onChange={handleChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving || !isValid()} className="w-full">
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Settings</CardTitle>
              <CardDescription>Requirements for monthly salary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Salary Amount (USD/month)</Label>
                <Input type="number" min="0" name="salary_amount_usd" value={config.salary_amount_usd} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Min. Total Downline Business (USD)</Label>
                <Input type="number" min="0" name="salary_min_downline_business" value={config.salary_min_downline_business} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Increment Requirement (%)</Label>
                <Input type="number" min="0" max="100" name="salary_monthly_increment_percent" value={config.salary_monthly_increment_percent} onChange={handleChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving || !isValid()} className="w-full">
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
