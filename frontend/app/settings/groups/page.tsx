'use client'

import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGroups } from '@/hooks/use-groups'

function truncateKeywords(keywords: string[], maxLength: number = 40): string {
  if (!keywords || keywords.length === 0) return '-'
  const joined = keywords.join(', ')
  if (joined.length <= maxLength) return joined
  return joined.substring(0, maxLength) + '...'
}

export default function GroupsSettingsPage() {
  const { groups, isLoading, error } = useGroups()

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

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Item Groups</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Groups</CardTitle>
          <CardDescription>
            Groups are used to categorize items for filtering and organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading groups...</p>
          ) : error ? (
            <p className="text-destructive">Failed to load groups</p>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground">No groups defined</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: group.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {group.item_count ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {truncateKeywords(group.keywords)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
