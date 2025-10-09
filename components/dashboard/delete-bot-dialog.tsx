"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Trash2 } from "lucide-react"
import type { Bot as BotType } from "@/lib/types"

interface DeleteBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bot: BotType | null
  onConfirm: (botId: number) => Promise<void>
}

export function DeleteBotDialog({ open, onOpenChange, bot, onConfirm }: DeleteBotDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [error, setError] = useState("")

  const expectedText = bot?.name || ""
  const isConfirmationValid = confirmationText === expectedText

  const handleConfirm = async () => {
    if (!bot || !isConfirmationValid) return

    setIsDeleting(true)
    setError("")

    try {
      await onConfirm(bot.id)
      setConfirmationText("")
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete bot")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setConfirmationText("")
    setError("")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              Delete Bot
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600">
            This action cannot be undone. This will permanently delete the bot{" "}
            <span className="font-semibold text-gray-900">"{bot?.name}"</span> and all its associated data including:
            <ul className="mt-2 ml-4 list-disc text-sm">
              <li>Conversation history</li>
              <li>Knowledge documents</li>
              <li>Analytics data</li>
              <li>Deployment settings</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700">
            To confirm deletion, type the bot name: <span className="font-semibold">"{bot?.name}"</span>
          </Label>
          <Input
            id="confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={`Type "${bot?.name}" to confirm`}
            className="mt-2"
            disabled={isDeleting}
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bot
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
