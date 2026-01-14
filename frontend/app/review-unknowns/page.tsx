'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReviewUnknownsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Review Unknown Items</h1>

      <Card>
        <CardHeader>
          <CardTitle>Unknown Items</CardTitle>
          <CardDescription>
            Items that have not been classified into a group. Review and assign them to appropriate groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unknown items table will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
