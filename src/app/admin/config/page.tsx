'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function AdminConfigPage() {
  const handleSave = () => {
    toast.success('Configuration updated successfully')
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage global settings, fees, and network constraints.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
            <CardDescription>Withdrawal and capping constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Minimum Withdrawal (USD)</Label>
              <Input type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label>Withdrawal Fee (%)</Label>
              <Input type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label>Platform Master Wallet</Label>
              <Input type="text" defaultValue="TRXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 mr-2" /> Save Settings</Button>
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
              <Input type="number" defaultValue="100" />
            </div>
            <div className="space-y-2">
              <Label>Min. Total Downline Business (USD)</Label>
              <Input type="number" defaultValue="5000" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Increment Requirement (%)</Label>
              <Input type="number" defaultValue="25" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 mr-2" /> Save Settings</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
