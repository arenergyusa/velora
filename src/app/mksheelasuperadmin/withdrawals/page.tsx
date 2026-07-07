'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawalData {
  id: string
  user: string
  amountUsd: number
  amountTrx: number
  date: string
}

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<WithdrawalData[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/withdrawals')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || data.success === false) throw new Error()
        return data
      })
      .then(data => {
        if (data.success) {
          setPendingRequests(data.data)
        }
      })
      .catch(() => toast.error('Failed to load pending withdrawals'))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Withdrawal ${action}d successfully`)
        setPendingRequests(prev => prev.filter(req => req.id !== id))
      } else {
        toast.error(data.error || `Failed to ${action} withdrawal`)
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setProcessingId(null)
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
        <h1 className="text-3xl font-bold tracking-tight">Pending Withdrawals</h1>
        <p className="text-muted-foreground mt-2">Approve or reject user withdrawal requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Amount (TRX)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No pending withdrawals found.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono">{req.user}</TableCell>
                    <TableCell>${req.amountUsd}</TableCell>
                    <TableCell>{req.amountTrx} TRX</TableCell>
                    <TableCell>{req.date}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAction(req.id, 'reject')} 
                        disabled={processingId === req.id}
                        className="text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleAction(req.id, 'approve')} 
                        disabled={processingId === req.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === req.id ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
