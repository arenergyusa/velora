'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminWithdrawalsPage() {
  const pendingRequests = [
    { id: '1', user: 'TR1...A9z', amountUsd: 150, amountTrx: 750, date: '2026-07-03' },
    { id: '2', user: 'TR8...B4c', amountUsd: 200, amountTrx: 1000, date: '2026-07-03' },
    { id: '3', user: 'TR9...D2e', amountUsd: 50, amountTrx: 250, date: '2026-07-02' },
  ]

  const handleApprove = (id: string) => {
    toast.success(`Withdrawal ${id} Approved`)
  }

  const handleReject = (id: string) => {
    toast.error(`Withdrawal ${id} Rejected`)
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
              {pendingRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono">{req.user}</TableCell>
                  <TableCell>${req.amountUsd}</TableCell>
                  <TableCell>{req.amountTrx} TRX</TableCell>
                  <TableCell>{req.date}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleReject(req.id)} className="text-destructive">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
