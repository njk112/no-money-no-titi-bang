'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useGroups, Group } from '@/hooks/use-groups'
import { GroupModal } from '@/components/group-modal'
import { api } from '@/lib/api'

function truncateKeywords(keywords: string[], maxLength: number = 40): string {
  if (!keywords || keywords.length === 0) return '-'
  const joined = keywords.join(', ')
  if (joined.length <= maxLength) return joined
  return joined.substring(0, maxLength) + '...'
}

export default function GroupsSettingsPage() {
  const { groups, isLoading, error, refetch } = useGroups()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (data: { name: string; description: string; color: string; keywords: string[] }) => {
    setIsSaving(true)
    try {
      if (editingGroup) {
        // Edit mode - PUT request
        await api.put(`/api/groups/${editingGroup.id}`, data)
        toast.success('Group updated successfully')
      } else {
        // Create mode - POST request
        await api.post('/api/groups', data)
        toast.success('Group created successfully')
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save group'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!groupToDelete) return

    try {
      await api.delete(`/api/groups/${groupToDelete.id}`)
      toast.success('Group deleted successfully')
      setDeleteDialogOpen(false)
      setGroupToDelete(null)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group'
      toast.error(message)
    }
  }

  const openDeleteDialog = (group: Group) => {
    setGroupToDelete(group)
    setDeleteDialogOpen(true)
  }

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
        <Button onClick={() => { setEditingGroup(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </Button>
      </div>

      <GroupModal
        group={editingGroup}
        open={modalOpen}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the group "{groupToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <TableHead className="w-32">Actions</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingGroup(group); setModalOpen(true); }}
                        >
                          Edit
                        </Button>
                        {!group.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(group)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
