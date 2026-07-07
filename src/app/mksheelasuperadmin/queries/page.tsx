'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RefreshCw, Mail, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface QueryData {
  id: string
  name: string
  email: string
  message: string
  date: string
}

export default function AdminQueriesPage() {
  const [loading, setLoading] = useState(true)
  const [queries, setQueries] = useState<QueryData[]>([])

  useEffect(() => {
    fetch('/api/admin/queries')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load queries')
        }
        return data
      })
      .then(data => {
        setQueries(data.data)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Queries</h1>
          <p className="text-muted-foreground mt-2">View messages submitted by users through the contact form.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-sm font-medium">
          Total: {queries.length}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {queries.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No queries found in the database.
          </div>
        ) : (
          queries.map((q) => (
            <Card key={q.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> {q.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {q.email}
                </CardDescription>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> {q.date}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap h-full border">
                  {q.message}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
